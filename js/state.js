document.querySelectorAll("button").forEach(button => {
    button.style.border = "0px solid black";
    button.style.borderRadius = "15px";
    button.style.padding = "0";
    button.style.fontSize = "30px"; 
    button.style.color = "black";
    button.style.webkitAppearance = "none";
    button.style.appearance = "none";
});
const canvas = document.getElementById("goban");
const ctx = canvas.getContext("2d");
const pawaBtn = document.getElementById("pawaBtn");
const oseBtn = document.getElementById("oseBtn");
const passBtn = document.getElementById("passBtn");
const resetBtn = document.getElementById("resetBtn");
if(ISNET){
}else{
const undoBtn = document.getElementById("undoBtn");
}
passBtn.style.backgroundColor="#DDDDDD";
undoBtn.style.backgroundColor="#DDDDDD";
oseBtn.style.backgroundColor="#DDDDDD";
pawaBtn.style.backgroundColor="#DDDDDD";
resetBtn.style.backgroundColor="#FFFFFF";

const turnDisplay = document.getElementById("turn");
const blackKingLibsDisplay = document.getElementById("blackKingLibs");
const whiteKingLibsDisplay = document.getElementById("whiteKingLibs");
const blackTameLibsDisplay = document.getElementById("blackTameLibs");
const whiteTameLibsDisplay = document.getElementById("whiteTameLibs");
const winText = document.createTextNode("のかち！");

const kuronekoImg = new Image();
kuronekoImg.src = "./bin/kuroneko.png";
const kurokingImg = new Image();
kurokingImg.src = "./bin/kuroking.png";
const sironekoImg = new Image();
sironekoImg.src = "./bin/sironeko.png";
const sirokingImg = new Image();
sirokingImg.src = "./bin/siroking.png";

const CELL = canvas.width / SIZE ;
const OFFSET = CELL/2;
const MAXTEKAZU=150;

let board = [];
let drawBoard = [];
let currentPlayer = "black";
let blackKing = null;
let whiteKing = null;
let blackTame = 0;
let whiteTame = 1;
let gameNow = true;
let gameMode="main";
let nitesu=0;
let koPoint = null;
let koBlack = null; // 白の手番時に禁止すべき場所
let koWhite = null; // 黒の手番時に禁止すべき場所
let prevKoPoint = null; 
let winMessage;
let undoHistory = [];
let blackYasumi=0;
let whiteYasumi=0;
let kaesisu=0;
let pawatorisu=0;
