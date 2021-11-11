

/*---------------------------------------------------------------------------
JavaScriptブロック崩しライブラリblock.js
 
使い方
------
HTMLファイルを作成し、headタグ内に以下のように書いてください。
 
<script type="text/javascript" src="block.js">
 
bodyタグには何も書かなくておｋ。
このタグより前にJavaScriptでonInitという関数を定義しておくと、初期化前に読み込まれます。onInitの中で設定変数を変更することができます。block.js自身を書き換える必要はありません。
 
 
Copyright (c) 2010 recyclebin5385 All rights reserved.
 
ソースコード形式かバイナリ形式か、変更するかしないかを問わず、以下の条件を満たす場合に限り、再頒布および使用が許可されます。
 
* ソースコードを再頒布する場合、上記の著作権表示、本条件一覧、および下記免責条項を含めること。
* バイナリ形式で再頒布する場合、頒布物に付属のドキュメント等の資料に、上記の著作権表示、本条件一覧、および下記免責条項を含めること。
* 書面による特別の許可なしに、本ソフトウェアから派生した製品の宣伝または販売促進に、作者の名前またはコントリビューターの名前を使用してはならない。
 
本ソフトウェアは、著作権者およびコントリビューターによって「現状のまま」提供されており、明示黙示を問わず、商業的な使用可能性、および特定の目的に対する適合性に関する暗黙の保証も含め、またそれに限定されない、いかなる保証もありません。著作権者もコントリビューターも、事由のいかんを問わず、損害発生の原因いかんを問わず、かつ責任の根拠が契約であるか厳格責任であるか（過失その他の）不法行為であるかを問わず、仮にそのような損害が発生する可能性を知らされていたとしても、本ソフトウェアの使用によって発生した（代替品または代用サービスの調達、使用の喪失、データの喪失、利益の喪失、業務の中断も含め、またそれに限定されない）直接損害、間接損害、偶発的な損害、特別損害、懲罰的損害、または結果損害について、一切責任を負わないものとします。
*/

//定数
var PHASE_START = 0;
var PHASE_PLAYING = 1;
var PHASE_GAMEOVER = 2;
var PHASE_CLEAR = 3;

//設定変数
var stageHeight = 420; //ステージの高さ
var backgroundColor = '#CCFFFF'; //ステージの背景色
var backgroundMarginLeft = 300; //ステージの左の余白
var backgroundMarginTop = 50; //ステージの上の余白
var backgroundMarginRight = 100; //ステージの右の余白
var backgroundMarginBottom = 50; //ステージの下の余白

var blockLeft = 0; //ステージ左右端からブロックまでの余白
var blockTop = 0; //ステージ上端からブロックまでの余白
var blockCountX = 8; //横方向のブロック数
var blockCountY = 8; //縦方向のブロック数
var blockWidth = 50; //ブロック1つの幅
var blockHeight = 30; //ブロック1つの高さ
var blockColors = new Array('transparent', '#9999ff'); //第2引数 … 薄紫色。ライフごとのブロックの色。画像適用しているので見た目上は関係がない
var blockImagePaths = new Array('', ''); //ライフごとのブロックの画像のパス。["", ""]


var barY = 400; //バー上端座標
var barWidth = 50; //バー幅
var barHeight = 10; //バー高さ
var barColor = '#cc6633'; //バーの色

var ballRadius = 2; //ボールの半径
var ballColor = '#ff0000'; //ボールの色。赤色
var penetrateBallColor = '#FF9900'; //貫通弾の色。黄色

var messageColor = '#ffff00'; //メッセージの色
var messageFontSize = '150%'; //メッセージのサイズ

var maxLife = 3; //プレイヤーの最大ライフ
var penetrateRegionWidth = 2; //打ち返すと貫通弾となる領域の幅
var maxClearMessageCount = 100; //クリアのメッセージが消えるまでのカウント

//var initialBlockLives = null; //ブロックのライフの初期値の配列　nullならぜんぶ1
var initialBlockLives = null; //ブロックのライフの初期値の配列　nullならぜんぶ1

var startMessage = 'LIFE: ${life} Click to start';
var gameoverMessage = 'GAME OVER';
var clearMessage = 'congratulations';


//制御変数
var stageWidth; //ステージ幅 blockLeft, blockCountX, blockWidthから自動計算

var oldBarX; //1フレーム前のバー左端座標
var barX; //バー左端座標
var ballX; //ボールのX座標
var ballY; //ボールのY座標
var ballDX; //ボールのX方向の変位
var ballDY; //ボールのY方向の変位

var blockLives; //ブロックのライフの配列

var backgroundElement; //背景の要素
var BarElement; //バーの要素
var blockElements; //ブロックの要素の配列
var ballElement; //ボールの要素
var messageElement; //メッセージの要素

var life; //プレイヤーのライフ
var blockCount; //残っているブロックの数

var phase = 'start'; //フェーズ

var penetrateFlag = false; //貫通フラグ
var lastHitBlockIndex; //最後に当たったブロックのインデックス
var maxClearMessageCount; //クリアのメッセージが消えるまでのフレーム数

var timerID; //タイマーのID

//初期化関数
function init() {
    if (typeof onInit == 'function') { //設定変数を変更するonInit関数を定義していれば、初期化前に読込
        onInit();
    }


    //座標の決定
    stageWidth = blockLeft * 2 + blockWidth * blockCountX; //0*2 + 50*8
    oldBarX = barX = (stageWidth - barWidth) / 2; //1フレーム前のバー左端座標 = バー左端座標 = (ステージ幅 - バー幅) / 2;


    //HTML要素の配置
    backgroundElement = document.createElement('div');
    backgroundElement.style.position = 'absolute';
    backgroundElement.style.left = 0;
    backgroundElement.style.top = 0;
    backgroundElement.style.marginLeft = backgroundMarginLeft + 'px';
    backgroundElement.style.marginTop = backgroundMarginTop + 'px';
    backgroundElement.style.marginRight = backgroundMarginRight + 'px';
    backgroundElement.style.marginBottom = backgroundMarginBottom + 'px';
    backgroundElement.style.width = stageWidth + 'px';
    backgroundElement.style.height = backgroundElement.style.lineHeight = stageHeight + 'px';
    backgroundElement.style.backgroundColor = backgroundColor;

    document.body.appendChild(backgroundElement);

    blockElements = new Array(blockCountX * blockCountY); //横方向のブロック数8 × 縦方向のブロック数8
    blockLives = new Array(blockCountX * blockCountY); //横方向のブロック数8 × 縦方向のブロック数8

    for (var j = 0; j < blockCountY; j++) { //縦方向のブロック数8 
        for (var i = 0; i < blockCountX; i++) { //横方向のブロック数8 var
            blockElement = createElement(blockWidth, blockHeight, 'transparent'); //ブロック1つの幅50。ブロック1つの高さ30
            blockElement.style.left = (blockLeft + i * blockWidth) + 'px'; //(0 + i * 50) 
            blockElement.style.top = (blockTop + j * blockHeight) + 'px'; //(0 + j * 30) 
            blockElement.style.backgroundPosition = (-i * blockWidth) + 'px ' + (-j * blockHeight) + 'px'; //(-i * 50) + 'px ' + (-j * 30) + 'px' 
            blockElements[i + j * blockCountX] = blockElement;
        }
    }

    barElement = createElement(barWidth, barHeight, barColor);
    ballElement = createElement(ballRadius * 2, ballRadius * 2, ballColor);
    messageElement = createElement(stageWidth, stageHeight, 'transparent');
    messageElement.style.left = '0px';
    messageElement.style.top = '0px';
    messageElement.style.color = messageColor;
    messageElement.style.textAlign = 'center';
    messageElement.style.fontSize = messageFontSize;
    messageElement.innerHTML = '';
    messageElement.style.visibility = 'hidden';
    resetGame(); //ゲームリセット関数呼出 
    setObjectPosition(); //要素の表示位置設定関数呼出
    window.document.onmousemove = onMouseMove; //マウスを動かしたら、「マウス移動のイベントハンドラ」を呼ぶ
    document.getElementById("start").onclick = onClick;

    setPhase(PHASE_START);
}


/*じゃんけんの挙動*/

//ランダムで何を出すか決める
const randomnumber1 = Math.random();
const randomnumber2 = Math.floor(randomnumber1 * 3);
console.log(randomnumber2);

if (randomnumber2 === 0) { //0の時グー

    function onInit() {
        blockImagePaths = new Array('url(img/gu.jpg)', 'url(img/ex_img.jpg)');
    }
    console.log("gu")
}
else if (randomnumber2 === 1) { //1のときチョキ
    function onInit() {
        blockImagePaths = new Array('url(img/choki.jpg)', 'url(img/ex_img.jpg)');
        gameoverMessage = '';
    }
    console.log("cho")
}
else if (randomnumber2 === 2) { //2のときパー
    function onInit() {
        blockImagePaths = new Array('url(img/pa.jpg)', 'url(img/ex_img.jpg)');
        gameoverMessage = '';
    }
    console.log("pa")
}


/*グーだったときの挙動、勝ったら時間ストップして情報蓄積*/

if (randomnumber2 === 0) {
    $('#button_gu').on('click', function () {
        alert("あいこでした");
    });

    $('#button_cho').on('click', function () {
        alert("負けでした");
    });

    $('#button_pa').on('click', function () {
        alert("勝ち！賞金があります！");
        //location.href = 'kadai_janken_win.html';
        clearTimeout(timerId);
        const wintime = document.getElementById("timer").textContent
        //document.getElementById("output-wintime").innerHTML = wintime;

        //戦績の記録
        const winhis = {
            title: "結果",
            text: wintime,
        };
        const jsonData = JSON.stringify(winhis);
        localStorage.setItem("memo", jsonData);


    });
}

/*チョキだったときの挙動*/
if (randomnumber2 === 1) {
    $('#button_gu').on('click', function () {
        alert("勝ち！賞金があります！");
        //location.href = 'kadai_janken_win.html';
        clearTimeout(timerId);
        const wintime = document.getElementById("timer").textContent
        //document.getElementById("output-wintime").innerHTML = wintime;

        //戦績の記録
        const winhis = {
            title: "結果",
            text: wintime,
        };
        const jsonData = JSON.stringify(winhis);
        localStorage.setItem("memo", jsonData);
    });

    $('#button_cho').on('click', function () {
        alert("あいこでした");
    });

    $('#button_pa').on('click', function () {
        alert("負けでした");

    });
}


/*パーだったときの挙動*/
if (randomnumber2 === 2) {
    $('#button_gu').on('click', function () {
        alert("負けでした");
    });

    $('#button_cho').on('click', function () {
        alert("勝ち！賞金があります！");
        //location.href = 'kadai_janken_win.html';
        clearTimeout(timerId);
        const wintime = document.getElementById("timer").textContent
        //document.getElementById("output-wintime").innerHTML = wintime;


        //戦績の記録
        const winhis = {
            title: "結果",
            text: wintime,
        };
        const jsonData = JSON.stringify(winhis);
        localStorage.setItem("memo", jsonData);

    });

    $('#button_pa').on('click', function () {
        alert("あいこでした");

    });
}


//直近の記録閲覧
$('#his').on('click', function () {
    const jsonData = localStorage.getItem("memo");
    const winhis = JSON.parse(jsonData);
    const winhistext = winhis.text
    console.log(winhistext);
    document.getElementById("output_wintime").innerHTML = winhistext;
});




/*じゃんけんの挙動終わり*--------------------------------------------------------*/



//クリックのイベントハンドラ。 
//htmlのidからデータを取得
//取得したデータを変数に代入

//クリック時の時間を保持するための変数定義
var startTime;

//経過時刻を更新するための変数。 初めはだから0で初期化
var elapsedTime = 0;

//タイマーを止めるにはclearTimeoutを使う必要があり、そのためにはclearTimeoutの引数に渡すためのタイマーのidが必要
var timerId;

//タイマーをストップ -> 再開させたら0になってしまうのを避けるための変数。
var timeToadd = 0;

//ミリ秒の表示ではなく、分とか秒に直すための関数, 他のところからも呼び出すので別関数として作る
//計算方法として135200ミリ秒経過したとしてそれを分とか秒に直すと -> 02:15:200
function updateTimetText() {

    //m(分) = 135200 / 60000ミリ秒で割った数の商　-> 2分
    var m = Math.floor(elapsedTime / 60000);

    //s(秒) = 135200 % 60000ミリ秒で / 1000 (ミリ秒なので1000で割ってやる) -> 15秒
    var s = Math.floor(elapsedTime % 60000 / 1000);

    //ms(ミリ秒) = 135200ミリ秒を % 1000ミリ秒で割った数の余り
    var ms = elapsedTime % 1000;


    //HTML 上で表示の際の桁数を固定する　例）3 => 03　、 12 -> 012
    //javascriptでは文字列数列を連結すると文字列になる
    //文字列の末尾2桁を表示したいのでsliceで負の値(-2)引数で渡してやる。
    m = ('0' + m).slice(-2);
    s = ('0' + s).slice(-2);
    ms = ('0' + ms).slice(-3);

    //HTMLのid　timer部分に表示させる　
    timer.textContent = m + ':' + s + ':' + ms;
}


//再帰的に使える用の関数
function countUp() {

    //timerId変数はsetTimeoutの返り値になるので代入する
    timerId = setTimeout(function () {

        //経過時刻は現在時刻をミリ秒で示すDate.now()からstartを押した時の時刻(startTime)を引く
        elapsedTime = Date.now() - startTime + timeToadd;
        updateTimetText()

        //countUp関数自身を呼ぶことで10ミリ秒毎に以下の計算を始める
        countUp();

        //1秒以下の時間を表示するために10ミリ秒後に始めるよう宣言
    }, 10);
}

//スタートをクリックしたら始まる
function onClick(event) {

    //ゲーム開始とともにタイマー起動
    (function () {
        'use strict';



        //在時刻を示すDate.nowを代入
        startTime = Date.now();

        //再帰的に使えるように関数を作る
        countUp();


    })();


    //複数ブラウザ対応用 
    if (window.event) {
        event = window.event;
    } if (event.button == 0) { //左クリック 
        switch (phase) {
            case PHASE_START: setPhase(PHASE_PLAYING);
                break; case PHASE_GAMEOVER: case PHASE_CLEAR: resetGame(); setPhase(PHASE_START); break; default: break;
        }
    }
}










//マウス移動のイベントハンドラ。 
function onMouseMove(event) {
    //複数ブラウザ対応用 
    if (window.event) { //window.eventが取得できたら
        event = window.event; //変数eventの値をwindow.eventに置き換える 
    }  //window.eventがundefinedの場合、if文はfalse

    barX = document.body.scrollLeft + event.clientX - backgroundMarginLeft - barWidth / 2;//ウインドウの横スクロール座標(ブラウザ画面左からのスクロール量)(px) + 

    if (barX < 0) {  //マウスx座標が0はより小さくなったら。マウスがステージより左端へ移動したら
        barX = 0; //マウスx座標は0
    }

    if (stageWidth < barX + barWidth) {
        //「マウスx座標＋バー幅」がステージ幅を超えたら。マウスがステージより右端へ移動したら 
        barX = stageWidth - barWidth;

        //マウスx座標は、ステージ幅-バー幅
    }
    switch (phase) {
        case PHASE_START: ballX = barX + barWidth / 2; ballY = barY - ballRadius; break;
        default: break;
    }
    setObjectPosition();
}

//フェーズを設定する。 
function setPhase(x) {
    phase = x; switch (phase) {
        case
            PHASE_START: resetBall(); clearInterval(timerID); messageElement.style.visibility = 'visible';
            messageElement.innerHTML = startMessage.replace('${life}', life);
            break;
        case PHASE_PLAYING: timerID = setInterval(onTimer, 33); //タイマー起動 
            messageElement.style.visibility = 'hidden';
            break; case PHASE_GAMEOVER: clearInterval(timerID);
            messageElement.style.visibility = 'visible';
            ballElement.style.visibility = 'hidden';
            messageElement.innerHTML = gameoverMessage;
            break;
        case PHASE_CLEAR: clearMessageCount = maxClearMessageCount
            messageElement.style.visibility = 'visible'; ballElement.style.visibility = 'hidden';
            messageElement.innerHTML = clearMessage;
            reak; default: break;

    } setObjectPosition();
}

//貫通フラグを切り替える。 
function setPenetrateFlag(x) { penetrateFlag = x; ballElement.style.backgroundColor = x ? penetrateBallColor : ballColor; }

//ボールの状態をリセットする 
function resetBall() {
    ballElement.style.visibility = 'visible';
    ballX = barX + barWidth / 2; //ボールx位置… バ－X位置＋バーの長さ半分(バー中心) 
    ballY = barY - ballRadius;  //ボールY位置 … バーY位置 － ボール半径定数「2」 
    ballDX = -3; ballDY = -5;
    lastHitBlockIndex = null; setPenetrateFlag(false); //貫通フラグ切替関数呼出 
}

//ゲームをリセットする。 
function resetGame() {
    life = maxLife;
    //プレイヤーの最大ライフ数 … 3 

    blockCount = blockCountX * blockCountY; //ステージエリア横方向配置ブロック数定数8 × ステージエリア縦方向配置ブロック数定数8 
    for (var i = 0;
        i < blockCount; i++) { //64 
        blockLives[i] = (initialBlockLives == null) ? 1 : initialBlockLives[i];//ブロックのライフの配列。ブロックのライフの初期値配列がnullなら1、それ以外ならinitialBlockLives配列にブロックの数を格納。initialBlockLivesは常にnullなので、ここは必ずTRUEになる。何のための条件分岐？
        //console.log(blockLives[i]); //ステージクリアしても常に1。どういう仕様？
        blockElements[i].style.backgroundImage = blockImagePaths[blockLives[i]]; //blockImagePaths[1];
        blockElements[i].style.backgroundColor = blockColors[blockLives[i]]; //blockColors[1];
    }

    resetBall();
}

//要素を作成し、背景の要素の子要素として登録する。
function createElement(width, height, color) {
    var ret = document.createElement('div');
    ret.style.position = 'absolute'; ret.style.width = width + 'px';
    ret.style.height = ret.style.lineHeight = height + 'px';
    ret.style.backgroundColor = color; ret.style.fontSize = '0px';
    backgroundElement.appendChild(ret); return ret;
}

//要素の表示位置を設定する。 
function setObjectPosition() {
    barElement.style.left = barX + 'px'; barElement.style.top = barY + 'px';
    ballElement.style.left = (ballX - ballRadius) + 'px';

    //ballRadius … ボール半径定数2 
    ballElement.style.top = (ballY - ballRadius) + 'px';
}

//ボールの位置にあるブロックのインデックスを返す。 
function getBlockIndexAtBall() {
    if ((ballX < blockLeft) || (stageWidth - blockLeft < ballX)) {
        return null;
    }

    if ((ballY < blockTop) || (blockTop + blockHeight * blockCountY < ballY)) { //ブロック上Y位置＋各ブロック高さ×ステージエリア縦方向配置ブロック数定数8
        return null;
    }

    return Math.floor((ballX - blockLeft) / blockWidth) + Math.floor((ballY - blockTop) / blockHeight) * blockCountX;
}

//タイマーのイベントハンドラ。 
function onTimer() {
    switch (phase) {
        case PHASE_PLAYING: onTimerPlaying();
            break;
        case PHASE_CLEAR: onTimerClear();
            break;
        default: break;
    }

} function onTimerPlaying() {

    //X方向の移動 
    ballX += ballDX; var index = getBlockIndexAtBall();

    if ((index != null) && (blockLives[index] > 0) && (lastHitBlockIndex != index)) {
        blockLives[index]--;

        if (blockLives[index] == 0) {
            blockCount--;
        }

        blockElements[index].style.backgroundImage = blockImagePaths[blockLives[index]];
        blockElements[index].style.backgroundColor = blockColors[blockLives[index]];

        if (!penetrateFlag) {
            ballX -= ballDX;
            ballDX = -ballDX;
        }
    }

    if ((ballX < 0) || (stageWidth < ballX)) { ballX -= ballDX; ballDX = -ballDX; } lastHitBlockIndex = index;

    //Y方向の移動
    //バーによる反射
    if ((ballY <= barY) && (barY < ballY + ballDY)) {
        var tmpX = (ballX * (ballY + ballDY - barY) + (ballX + ballDX) * (barY - ballY)) / ballDY;

        if ((barX <= tmpX) && (tmpX < barX + barWidth)) {
            ballDY = - ballDY;
            ballDX += (Math.random() - 0.5) * 1.0 + Math.min(5, Math.max(-5, barX - oldBarX)) * 0.1;
            setPenetrateFlag(Math.abs(barX + barWidth / 2 - tmpX) < penetrateRegionWidth / 2);
        }
    }

    ballY += ballDY; index = getBlockIndexAtBall();

    if ((index != null) && (blockLives[index] > 0) && (lastHitBlockIndex != index)) {
        blockLives[index]--;
        if (blockLives[index] == 0) {
            blockCount--;
        }

        blockElements[index].style.backgroundImage = blockImagePaths[blockLives[index]];
        blockElements[index].style.backgroundColor = blockColors[blockLives[index]];

        if (!penetrateFlag) {
            ballY -= ballDY;
            ballDY = -ballDY;
        }
    }

    if (ballY < 0) {
        ballY -= ballDY; ballDY = -ballDY;
    }

    if (stageHeight < ballY) {
        life--;
        setPhase(life > 0 ? PHASE_START : PHASE_GAMEOVER);
    }

    lastHitBlockIndex = index;


    setObjectPosition();

    oldBarX = barX;

    if (blockCount == 0) {
        setPhase(PHASE_CLEAR);
    }
}

function onTimerClear() {
    if (clearMessageCount > 0) {
        clearMessageCount--;
        if (clearMessageCount == 0) {
            messageElement.style.visibility = 'hidden';
        }
    }
}

//初期化コード
window.onload = init;