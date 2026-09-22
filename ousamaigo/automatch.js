const crypto = require("crypto");


// ============================================================
// 自動マッチング
// ============================================================

module.exports = function createAutoMatch({
    io,
    pool,
    rating,
    onMatchCreated
}) {

    // --------------------------------------------------------
    // 待機中プレイヤー
    // --------------------------------------------------------

    let autoMatchQueue = [];

    let matchingNow = false;


    // ========================================================
    // SocketからユーザーIDを取得
    // ========================================================

    async function getUserIdFromSocket(socket) {

        const cookie =
            socket.handshake.headers.cookie || "";

        const match =
            cookie.match(
                /(?:^|;\s*)sessionId=([^;]+)/
            );

        if (!match) {
            return null;
        }

        const sessionId = match[1];

        try {

            const result = await pool.query(
                `
                SELECT user_id
                FROM login_sessions
                WHERE session_id = $1
                  AND expires_at > NOW()
                `,
                [sessionId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0].user_id;

        } catch (err) {

            console.error(
                "自動マッチング ログイン確認エラー:",
                err
            );

            return null;
        }
    }


    // ========================================================
    // ユーザーのレベル取得
    // ========================================================

    async function getUserLevel(userId) {

        try {

            const result = await pool.query(
                `
                SELECT level
                FROM users
                WHERE user_id = $1
                `,
                [userId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return Number(result.rows[0].level);

        } catch (err) {

            console.error(
                "自動マッチング レベル取得エラー:",
                err
            );

            return null;
        }
    }


    // ========================================================
    // 待機状況を送信
    // ========================================================

    function broadcastStatus() {

        const players =
            autoMatchQueue.map(player => ({
                level: player.level
            }));


        io.sockets.sockets.forEach(socket => {

            const me =
                autoMatchQueue.find(
                    player =>
                        player.socketId === socket.id
                );


            socket.emit(
                "autoMatchStatus",
                {
                    myLevel:
                        me ? me.level : 0,

                    count:
                        autoMatchQueue.length,

                    players
                }
            );

        });
    }


    // ========================================================
    // 待機列から削除
    // ========================================================

    function removeFromQueue(socketId) {

        const index =
            autoMatchQueue.findIndex(
                player =>
                    player.socketId === socketId
            );

        if (index === -1) {
            return false;
        }

        autoMatchQueue.splice(index, 1);

        return true;
    }


    // ========================================================
    // 自動マッチング
    // ========================================================

    async function tryAutoMatch() {

        if (matchingNow) {
            return;
        }

        if (autoMatchQueue.length < 2) {

            broadcastStatus();

            return;
        }


        matchingNow = true;


        try {

            // 古い順
            autoMatchQueue.sort(
                (a, b) =>
                    a.joinedAt - b.joinedAt
            );


            while (autoMatchQueue.length >= 2) {

                let pairFound = false;


                // ------------------------------------------------
                // レベル差2以下の組み合わせを探す
                // ------------------------------------------------

                for (
                    let i = 0;
                    i < autoMatchQueue.length;
                    i++
                ) {

                    for (
                        let j = i + 1;
                        j < autoMatchQueue.length;
                        j++
                    ) {

                        const player1 =
                            autoMatchQueue[i];

                        const player2 =
                            autoMatchQueue[j];


                        const levelDifference =
                            Math.abs(
                                player1.level -
                                player2.level
                            );


                        // レベル差2以下だけマッチング
                        if (levelDifference > 2) {
                            continue;
                        }


                        // ----------------------------------------
                        // Socket確認
                        // ----------------------------------------

                        const socket1 =
                            io.sockets.sockets.get(
                                player1.socketId
                            );

                        const socket2 =
                            io.sockets.sockets.get(
                                player2.socketId
                            );


                        // 切断済みなら待機列から削除
                        if (!socket1) {

                            autoMatchQueue.splice(i, 1);

                            pairFound = true;

                            break;
                        }

                        if (!socket2) {

                            autoMatchQueue.splice(j, 1);

                            pairFound = true;

                            break;
                        }


                        // ----------------------------------------
                        // 待機列から2人を削除
                        // ----------------------------------------

                        autoMatchQueue.splice(j, 1);

                        autoMatchQueue.splice(i, 1);


                        // ----------------------------------------
                        // 対局開始
                        // ----------------------------------------

                        await startAutoMatch(
                            player1,
                            player2,
                            socket1,
                            socket2
                        );


                        pairFound = true;

                        break;
                    }


                    if (pairFound) {
                        break;
                    }
                }


                // 組み合わせが見つからなかった
                if (!pairFound) {
                    break;
                }
            }

        } catch (err) {

            console.error(
                "自動マッチングエラー:",
                err
            );

        } finally {

            matchingNow = false;

            broadcastStatus();
        }
    }


    // ========================================================
    // 自動対局開始
    // ========================================================

    async function startAutoMatch(
        player1,
        player2,
        socket1,
        socket2
    ) {

        // ----------------------------------------------------
        // room作成
        // ----------------------------------------------------

        const roomId =
            "auto_" + crypto.randomUUID();


        const room = {

            roomId,

            hostId:
                player1.socketId,

            guestId:
                player2.socketId,

            hostUserId:
                player1.userId,

            guestUserId:
                player2.userId,

            hostLevel:
                player1.level,

            guestLevel:
                player2.level,

            hostMember:
                true,

            guestMember:
                true,

            memberOnly:
                false,

            // 自動マッチング
            matchType:
                "auto",

            // 盤サイズ
            size:
                9,

            // 時計
            blackTime:
                60000,

            whiteTime:
                60000,

            turn:
                "black",

            ratingFinished:
                false,

            gameState:
                null
        };


        // ----------------------------------------------------
        // Socketをroomに参加させる
        // ----------------------------------------------------

        socket1.join(roomId);
        socket2.join(roomId);


        // ----------------------------------------------------
        // Rating用のプレイヤー情報
        // ----------------------------------------------------

        room.hostPlayer =
            await rating.startPlayer({
                userId:
                    player1.userId
            });


        room.guestPlayer =
            await rating.startPlayer({
                userId:
                    player2.userId
            });


        // startPlayer側でレベルが取得できた場合は
        // そちらを正式な値として使用
        if (
            room.hostPlayer &&
            room.hostPlayer.level !== undefined
        ) {

            room.hostLevel =
                Number(room.hostPlayer.level);
        }


        if (
            room.guestPlayer &&
            room.guestPlayer.level !== undefined
        ) {

            room.guestLevel =
                Number(room.guestPlayer.level);
        }


        // ----------------------------------------------------
        // 色決定
        // ----------------------------------------------------

        let hostColor;
        let guestColor;


        // 同じレベルならランダム
        if (
            room.hostLevel ===
            room.guestLevel
        ) {

            if (Math.random() < 0.5) {

                hostColor = "black";
                guestColor = "white";

            } else {

                hostColor = "white";
                guestColor = "black";
            }

        } else {

            // レベルが低い方が黒
            if (
                room.hostLevel <
                room.guestLevel
            ) {

                hostColor = "black";
                guestColor = "white";

            } else {

                hostColor = "white";
                guestColor = "black";
            }
        }


        room.hostColor =
            hostColor;

        room.guestColor =
            guestColor;


        // ----------------------------------------------------
        // 自動マッチングなので
        // レベル差3以上による白番開始は発生しない
        // ----------------------------------------------------

        room.turn = "black";


        // ----------------------------------------------------
        // 少し待ってから時計開始
        // ----------------------------------------------------

        room.lastUpdate =
            Date.now() + 3000;


        // ----------------------------------------------------
        // server.jsのgameRoomsへ追加
        // ----------------------------------------------------

        if (
            typeof onMatchCreated ===
            "function"
        ) {

            await onMatchCreated(room);
        }


        // ----------------------------------------------------
        // ホスト側へ開始通知
        // ----------------------------------------------------

        socket1.emit(
            "startGame",
            {
                roomId:
                    room.roomId,

                size:
                    room.size,

                color:
                    room.hostColor,

                mylv:
                    room.hostPlayer.level,

                enlv:
                    room.guestPlayer.level,

                member:
                    true,

                matchType:
                    "auto"
            }
        );


        // ----------------------------------------------------
        // 相手側へ開始通知
        // ----------------------------------------------------

        socket2.emit(
            "startGame",
            {
                roomId:
                    room.roomId,

                size:
                    room.size,

                color:
                    room.guestColor,

                mylv:
                    room.guestPlayer.level,

                enlv:
                    room.hostPlayer.level,

                member:
                    true,

                matchType:
                    "auto"
            }
        );


        console.log(
            "自動マッチング成立:",
            player1.userId,
            "Lv" + room.hostLevel,
            "vs",
            player2.userId,
            "Lv" + room.guestLevel
        );
    }


    // ========================================================
    // Socket接続時
    // ========================================================

    io.on("connection", socket => {


        // ====================================================
        // 自動マッチング参加
        // ====================================================

        socket.on(
            "joinAutoMatch",
            async () => {

                try {

                    // ------------------------------------------
                    // 会員確認
                    // ------------------------------------------

                    const userId =
                        await getUserIdFromSocket(
                            socket
                        );


                    if (!userId) {

                        socket.emit(
                            "autoMatchError",
                            {
                                message:
                                    "自動マッチングは会員限定です。"
                            }
                        );

                        return;
                    }


                    // ------------------------------------------
                    // レベル取得
                    // ------------------------------------------

                    const level =
                        await getUserLevel(
                            userId
                        );


                    if (
                        level === null ||
                        level === undefined
                    ) {

                        socket.emit(
                            "autoMatchError",
                            {
                                message:
                                    "レベル情報を取得できませんでした。"
                            }
                        );

                        return;
                    }


                    // ------------------------------------------
                    // 同じSocketがすでに待機していたら削除
                    // ------------------------------------------

                    removeFromQueue(
                        socket.id
                    );


                    // ------------------------------------------
                    // 待機列へ追加
                    // ------------------------------------------

                    autoMatchQueue.push({

                        socketId:
                            socket.id,

                        userId,

                        level,

                        joinedAt:
                            Date.now()
                    });


                    console.log(
                        "自動マッチング待機:",
                        userId,
                        "Lv" + level
                    );


                    // ------------------------------------------
                    // 待機状況を送信
                    // ------------------------------------------

                    broadcastStatus();


                    // ------------------------------------------
                    // マッチング開始
                    // ------------------------------------------

                    await tryAutoMatch();

                } catch (err) {

                    console.error(
                        "自動マッチング参加エラー:",
                        err
                    );

                    socket.emit(
                        "autoMatchError",
                        {
                            message:
                                "自動マッチングでエラーが発生しました。"
                        }
                    );
                }
            }
        );


        // ====================================================
        // 自動マッチングキャンセル
        // ====================================================

        socket.on(
            "cancelAutoMatch",
            () => {

                const removed =
                    removeFromQueue(
                        socket.id
                    );


                if (removed) {

                    console.log(
                        "自動マッチングキャンセル:",
                        socket.id
                    );
                }


                broadcastStatus();
            }
        );


        // ====================================================
        // 切断
        // ====================================================

        socket.on(
            "disconnect",
            () => {

                const removed =
                    removeFromQueue(
                        socket.id
                    );


                if (removed) {

                    console.log(
                        "自動マッチング待機解除:",
                        socket.id
                    );

                    broadcastStatus();
                }
            }
        );

    });


    // ========================================================
    // 外部から待機人数などを取得したい場合
    // ========================================================

    return {

        getQueue() {
            return autoMatchQueue;
        },

        getWaitingCount() {
            return autoMatchQueue.length;
        }

    };
};