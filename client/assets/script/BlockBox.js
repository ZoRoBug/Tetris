const config = require('./Config');
const utility = require('./public/Utility');
const BlockLogic = require('./public/BlockLogic');

const BLOCK_SIZE = 58; // 方块尺寸大小
const BLOCK_NUM_H = 7; // 水平方块数量
const BLOCK_NUM_V = 12; // 垂直方块数量

const RANDOM_TIME = 0.2; // 随机时间方块概率
const COUNTDOWN_INIT = 300000; // 倒计时初始值(毫秒)

function ResetData() {
    this.gameScore = 0;
    this.gamePause = false;
    this.moveBlockX = 0, this.moveBlockY = 0;

    this.speedUpTime = 0, this.speedUpIndex = 0;
    this.dropSpeed = config.dropSpeed;

    this.countdownTotal = COUNTDOWN_INIT;
    this.countdownTime = 0, this.remainSecond = 0;

    this.blockLogic.Restart();
}

function UpdateSpeed() {
    if (this.speedUpIndex >= config.speedUpList.length) return;
    let cfgSpeedUp = config.speedUpList[this.speedUpIndex];
    if (this.speedUpTime >= cfgSpeedUp[0] * 1000) {
        this.dropSpeed -= cfgSpeedUp[1];
        this.dropSpeed = Math.max(this.dropSpeed, 100);
        this.speedUpTime = 0, this.speedUpIndex++;
        return true;
    }
}

function GameOverResult() {
    let nodeResult = cc.find('Canvas').getChildByName('Result');
    nodeResult.getComponent('Result').Show(this.gameScore);
}

function UpdateCountdown() {
    let remainSecond = this.countdownTotal - this.countdownTime;
    remainSecond = Math.ceil(Math.max(remainSecond, 0) / 1000);

    let nodeCountdown = cc.find('Countdown', this.node.parent.parent);
    let labelCountdown = nodeCountdown.getComponent(cc.Label);
    labelCountdown.string = String(remainSecond) + 's';

    if (this.remainSecond != remainSecond) {
        this.remainSecond = remainSecond;
        if (this.remainSecond <= 30) {
            let action1 = cc.scaleTo(0.2, 1.5);
            let action2 = cc.scaleTo(0.2, 1.0);
            nodeCountdown.runAction(cc.sequence(action1, action2));
        }
    }
}

function SetBlock(x, y, blockNum, blockCnt, blockSec, isOpacity) {
    if (!this.blockLogic.CoordValid(x, y)) return;
    let nodeBlock = this.blockGrid[y][x];
    let jsBlock = nodeBlock.getComponent('BlockUnit');
    jsBlock.SetBlock(blockNum, blockCnt, blockSec, isOpacity);
}

function DropBlock(oneStep) {
    OpenMoveTimer.call(this, false);
    let isDropEnd = this.blockLogic.Drop(oneStep);
    this.DrawMoveBlock();
    if (isDropEnd) {
        if (!oneStep) {
            let endX = this.moveBlockX;
            let endY = this.moveBlockY;
            ShowDropMove.call(this, endX, endY);
            cc.audioEngine.play(this.audioDrop, false, 1);
        }
        this.blockLogic.MergeBlocks([
            [this.moveBlockX, this.moveBlockY]
        ]);
    } else {
        OpenMoveTimer.call(this, true);
    }
}

function OpenMoveTimer(open) {
    if (!open) {
        clearTimeout(this.moveTimer);
        this.moveTimer = null;
        return;
    }
    if (this.moveTimer) return;
    this.moveTimer = setTimeout(function () {
        DropBlock.call(this, true);
    }.bind(this), this.dropSpeed);
}

function DoMergeBlock(x, y, blocks, is23, callback) {
    if (!this.blockLogic.CoordValid(x, y) || blocks.length === 0) {
        callback(x, y, 0);
        return;
    }

    let nodeMergeBlock = null;
    let keyIndex = null, nodeBlocks = new Array();
    for (let i = 0; i < blocks.length; ++i) {
        let ix = blocks[i][0], iy = blocks[i][1];
        let nodeBlock = this.blockGrid[iy][ix];
        let nodeCopy = cc.instantiate(nodeBlock);
        nodeCopy.active = true;
        this.node.addChild(nodeCopy);

        let copyJS = nodeCopy.getComponent('BlockUnit');
        let blockJS = nodeBlock.getComponent('BlockUnit');
        copyJS.SetBlock(blockJS.GetBlockNum(), blockJS.GetBlockCnt());

        nodeBlocks[i] = nodeCopy;
        if (ix === x && iy === y) {
            nodeMergeBlock = nodeBlock;
            nodeCopy.zIndex = 1;
            keyIndex = i;
        }

        if (blocks[i][2].sec) {
            ShowSecond.call(this, ix, iy, blocks[i][2].num);
        }
    }
    if (keyIndex === null) {
        callback(x, y, 0);
        return;
    }

    let maxDistanceIndex = keyIndex;
    for (let i = 0; i < blocks.length; ++i) {
        let newDistance = Math.abs(i - keyIndex);
        let maxDistance = Math.abs(maxDistanceIndex - keyIndex);
        if (maxDistance < newDistance) maxDistanceIndex = i;
    }

    let audioMerge = this.audioMerge;
    let keyBlock = nodeBlocks[keyIndex];
    let actionBig = cc.scaleBy(0.1, 1.25);
    keyBlock.runAction(cc.sequence(actionBig, cc.callFunc(function () {
        nodeMergeBlock.active = false;
        for (let i = 0; i < blocks.length; ++i) {
            if (i === keyIndex) continue;

            let moveSecond = Math.abs(i - keyIndex) * 0.13;
            if (i === maxDistanceIndex) moveSecond += 0.05;
            let actionMove = cc.moveTo(moveSecond, cc.v2(keyBlock.x, keyBlock.y));
            nodeBlocks[i].runAction(cc.sequence(actionMove, cc.callFunc(function () {
                nodeBlocks[i].parent = null;
                nodeBlocks[i].destroy();

                cc.audioEngine.play(audioMerge, false, 1);

                let keyBlockJS = keyBlock.getComponent('BlockUnit');
                let keyBlockNum = keyBlockJS.GetBlockNum() + blocks[i][2].num;
                let keyBlockCnt = keyBlockJS.GetBlockCnt() + blocks[i][2].cnt;
                keyBlockJS.SetBlock(keyBlockNum, keyBlockCnt);

                if (maxDistanceIndex === i) {
                    let actionDelay = cc.delayTime(0.2);
                    let actionSmall = cc.scaleBy(0.1, is23 ? 0.0 : 0.8);
                    keyBlock.runAction(cc.sequence(actionDelay, actionSmall, cc.callFunc(function () {
                        nodeMergeBlock.active = true;
                        keyBlock.parent = null;
                        keyBlock.destroy();
                        callback(x, y, is23 ? keyBlockCnt : 1);
                    })));
                }
            })));
        }
    })));
}

function DoDropBlock(startX, startY, endX, endY, callback) {
    let nodeBlock = this.blockGrid[startY][startX];
    let nodeDropBlock = cc.instantiate(nodeBlock);
    nodeDropBlock.active = true;
    this.node.addChild(nodeDropBlock);

    let nodeEndBlock = this.blockGrid[endY][endX];
    nodeEndBlock.active = false;

    let moveSecond = (endY - startY + 1) * 0.01;
    let actionMove = cc.moveTo(moveSecond, cc.v2(nodeEndBlock.x, nodeEndBlock.y));
    nodeDropBlock.runAction(cc.sequence(actionMove, cc.callFunc(function () {
        nodeEndBlock.active = true;
        nodeDropBlock.parent = null;
        nodeDropBlock.destroy();
        callback();
    })));
}

function ShowSecond(x, y, second) {
    if (second <= 0) return;

    let nodeSecond = new cc.Node();
    let nodeBlock = this.blockGrid[y][x];
    nodeSecond.x = nodeBlock.x, nodeSecond.y = nodeBlock.y;
    nodeSecond.width = BLOCK_SIZE, nodeSecond.height = BLOCK_SIZE;
    nodeSecond.color = new cc.Color(0, 255, 255);
    this.node.addChild(nodeSecond);

    let labelSecond = nodeSecond.addComponent(cc.Label);
    labelSecond.string = '+' + second;
    labelSecond.lineHeight = 32;
    labelSecond.fontSize = 32;

    let nodeCountdown = cc.find('Countdown', this.node.parent.parent);
    let actionMove1 = cc.moveTo(0.3, nodeSecond.x, nodeSecond.y + BLOCK_SIZE);
    let actionMove2 = cc.jumpTo(0.1 * y, nodeCountdown.x, nodeCountdown.y, 50, 1);
    let actionSpawn = cc.spawn(cc.fadeOut(0.1 * y + 0.3), actionMove2);
    nodeSecond.runAction(cc.sequence(actionMove1, actionSpawn, cc.callFunc(function () {
        this.countdownTotal += (second * 1000);
        UpdateCountdown.call(this);
        nodeSecond.parent = null;
        nodeSecond.destroy();
    }.bind(this))));
}

function ShowScore(x, y, score) {
    if (score <= 0 || !this.blockLogic.CoordValid(x, y)) return;

    let multiple = 1;
    if (this.mergeContinueCount > 1) {
        multiple = Math.min(this.mergeContinueCount, 3);
    }
    this.gameScore += (score * multiple);

    cc.audioEngine.play(this.audioScore, false, 1);

    let nodeScore = new cc.Node();
    let nodeBlock = this.blockGrid[y][x];
    nodeScore.x = nodeBlock.x, nodeScore.y = nodeBlock.y;
    nodeScore.width = BLOCK_SIZE, nodeScore.height = BLOCK_SIZE;
    nodeScore.color = new cc.Color(255, 255, 255);
    if (multiple === 2) {
        nodeScore.color = new cc.Color(0, 162, 232);
    } else if (multiple === 3) {
        nodeScore.color = new cc.Color(37, 177, 76);
    }
    this.node.addChild(nodeScore);

    let labelScore = nodeScore.addComponent(cc.Label);
    labelScore.string = '+' + (score * multiple);
    labelScore.lineHeight = 32;
    labelScore.fontSize = 32;

    let nodeGameScore = cc.find('GameScore', this.node.parent.parent);
    let jumpX = nodeGameScore.x - nodeGameScore.width / 2 + 20;
    let jumpY = nodeGameScore.y;

    let actionMove1 = cc.moveTo(0.3, nodeScore.x, nodeScore.y + BLOCK_SIZE);
    let actionMove2 = cc.jumpTo(0.1 * y, jumpX, jumpY, 50, 1);
    let actionSpawn = cc.spawn(cc.fadeOut(0.1 * y + 0.3), actionMove2);
    nodeScore.runAction(cc.sequence(actionMove1, actionSpawn, cc.callFunc(function () {
        nodeScore.parent = null;
        nodeScore.destroy();
    })));
}

function ShowDropMove(x, y) {
    if (!this.blockLogic.CoordValid(x, y)) return;

    let nodeDrop = new cc.Node();
    let spriteDrop = nodeDrop.addComponent(cc.Sprite);
    spriteDrop.spriteFrame = this.spriteFrameDropAni;
    nodeDrop.zIndex = -1;

    let nodeBlock = this.blockGrid[y][x];
    nodeDrop.x = nodeBlock.x, nodeDrop.height = 40;
    nodeDrop.y = nodeBlock.y + BLOCK_SIZE / 2 + 100;
    this.node.addChild(nodeDrop);

    let actionFadeOut = cc.fadeOut(0.12);
    let actionScale = cc.scaleBy(0.12, 1.2, 7);
    nodeDrop.runAction(cc.sequence(actionScale, actionFadeOut, cc.callFunc(function () {
        nodeDrop.parent = null;
        nodeDrop.destroy();
    })));
}

cc.Class({
    extends: cc.Component,

    properties: {
        audioDrop: {
            default: null,
            type: cc.AudioClip
        },
        audioMerge: {
            default: null,
            type: cc.AudioClip
        },
        audioScore: {
            default: null,
            type: cc.AudioClip
        },
        audioSpeedUp: {
            default: null,
            type: cc.AudioClip
        },
        prefabBlockUnit: {
            default: null,
            type: cc.Prefab,
        },
        spriteFrameDropAni: {
            default: null,
            type: cc.SpriteFrame,
        },
    },

    start() {
        this.blockGrid = new Array();
        let gridHalfSize = BLOCK_SIZE / 2;
        let boxHalfWidth = BLOCK_NUM_H * BLOCK_SIZE / 2;
        let boxHalfHeight = BLOCK_NUM_V * BLOCK_SIZE / 2;
        for (let iy = 0; iy < BLOCK_NUM_V; ++iy) {
            this.blockGrid[iy] = new Array();
            for (let ix = 0; ix < BLOCK_NUM_H; ++ix) {
                let nodeBlock = cc.instantiate(this.prefabBlockUnit);
                nodeBlock.width = BLOCK_SIZE, nodeBlock.height = BLOCK_SIZE;
                nodeBlock.x = ix * BLOCK_SIZE + gridHalfSize - boxHalfWidth;
                nodeBlock.y = (-iy - 1) * BLOCK_SIZE + gridHalfSize + boxHalfHeight;
                this.blockGrid[iy][ix] = nodeBlock;
                this.node.addChild(nodeBlock);
            }
        }

        this.blockLogic = new BlockLogic(BLOCK_NUM_H, BLOCK_NUM_V);

        this.blockLogic.on('DROP_BLOCKS', function (dropStartBlocks, dropEndBlocks) {
            if (dropEndBlocks.length > 0) {
                this.dropTimes = 0;
                function DBCallback() {
                    if (++this.dropTimes === dropEndBlocks.length) {
                        this.blockLogic.MergeBlocks(dropEndBlocks);
                    }
                }
                for (let i = 0; i < dropEndBlocks.length; ++i) {
                    let sx = dropStartBlocks[i][0], sy = dropStartBlocks[i][1];
                    let ex = dropEndBlocks[i][0], ey = dropEndBlocks[i][1];
                    DoDropBlock.call(this, sx, sy, ex, ey, DBCallback.bind(this));
                }
                this.RefreshScreen();
            } else if (this.blockLogic.GameOver()) {
                GameOverResult.call(this);
            } else {
                this.CreateNextBlock();
            }
        }.bind(this));

        this.blockLogic.on('MERGE_BLOCKS_LIST', function (mergeBlocksList) {
            if (mergeBlocksList.length > 0) {
                this.mergeContinueCount++;
                this.mergeBlockTimes = 0, this.mergeScoreList = new Array();
                function MBCallback(x, y, score) {
                    let hasScoreInfo = false;
                    for (let i = 0; i < this.mergeScoreList.length; ++i) {
                        let scoreX = this.mergeScoreList[i][0];
                        let scoreY = this.mergeScoreList[i][1];
                        if (scoreX === x && scoreY === y) {
                            this.mergeScoreList[i][2] += score;
                            hasScoreInfo = true;
                            break;
                        }
                    }
                    if (!hasScoreInfo && score > 0) this.mergeScoreList.push([x, y, score]);

                    if (++this.mergeBlockTimes === mergeBlocksList.length * 4) {
                        let mergeBlocks = new Array();
                        for (let i = 0; i < mergeBlocksList.length; ++i) {
                            let ix = mergeBlocksList[i][0];
                            let iy = mergeBlocksList[i][1];
                            if (this.blockLogic.HasBlock(ix, iy)) {
                                mergeBlocks.push([ix, iy]);
                            }
                        }
                        for (let i = 0; i < this.mergeScoreList.length; ++i) {
                            let ix = this.mergeScoreList[i][0];
                            let iy = this.mergeScoreList[i][1];
                            let score = this.mergeScoreList[i][2];
                            ShowScore.call(this, ix, iy, score);
                        }
                        this.blockLogic.DropBlocks(mergeBlocks);
                    }
                }
                for (let i = 0; i < mergeBlocksList.length; ++i) {
                    let block10List = mergeBlocksList[i][2];
                    let block20List = mergeBlocksList[i][3];
                    let block23HList = mergeBlocksList[i][4];
                    let block23VList = mergeBlocksList[i][5];
                    let x = mergeBlocksList[i][0], y = mergeBlocksList[i][1];
                    DoMergeBlock.call(this, x, y, block10List, false, MBCallback.bind(this));
                    DoMergeBlock.call(this, x, y, block20List, false, MBCallback.bind(this));
                    DoMergeBlock.call(this, x, y, block23HList, true, MBCallback.bind(this));
                    DoMergeBlock.call(this, x, y, block23VList, true, MBCallback.bind(this));
                }
                this.RefreshScreen();
            } else if (this.blockLogic.GameOver()) {
                GameOverResult.call(this);
            } else {
                this.CreateNextBlock();
            }
        }.bind(this));

        setInterval(function () {
            if (!this.moveTimer) return;
            this.speedUpTime += 100;
            this.countdownTime += 100;
            UpdateCountdown.call(this);
        }.bind(this), 100);

        this.RefreshScreen();
    },

    RestartGame() {
        ResetData.call(this);
        this.RefreshScreen();
        this.CreateNextBlock();
    },

    GetGameScore() {
        return this.gameScore;
    },

    RefreshScreen() {
        let blockGrid = this.blockLogic.GetBlockGrid();
        for (let iy = 0; iy < BLOCK_NUM_V; ++iy) {
            for (let ix = 0; ix < BLOCK_NUM_H; ++ix) {
                let blockCnt = blockGrid[iy][ix].cnt;
                let blockNum = blockGrid[iy][ix].num;
                let blockSec = blockGrid[iy][ix].sec;
                SetBlock.call(this, ix, iy, blockNum, blockCnt, blockSec);
            }
        }
    },

    DrawMoveBlock() {
        let oldX = this.moveBlockX, oldY = this.moveBlockY;
        SetBlock.call(this, oldX, oldY, 0, 0);
        let oldEndY = this.blockLogic.GetDropEnd(oldX, oldY);
        SetBlock.call(this, oldX, oldEndY, 0, 0);

        let blockInfo = this.blockLogic.GetMoveBlock();
        let x = blockInfo[0], y = blockInfo[1];
        let num = blockInfo[2], sec = blockInfo[3];
        SetBlock.call(this, x, y, num, 1, sec);

        let newEndY = this.blockLogic.GetDropEnd(x, y);
        if (newEndY != y) SetBlock.call(this, x, newEndY, num, 1, sec, true);

        this.moveBlockX = x, this.moveBlockY = y;
    },

    CreateNextBlock() {
        function NextBlock() {
            let num = utility.Random(1, 9);
            let sec = (utility.Random(1, 100) <= 100 * RANDOM_TIME);
            this.moveBlockY = 0, this.moveBlockX = Math.ceil(BLOCK_NUM_H / 2) - 1;
            this.blockLogic.SetMoveBlock(this.moveBlockX, this.moveBlockY, num, sec);
            this.blockCreateTime = (new Date()).getTime();
            this.DrawMoveBlock();
            OpenMoveTimer.call(this, true);
            this.mergeContinueCount = 0;
        }

        if (this.countdownTime >= this.countdownTotal) {
            GameOverResult.call(this);
            return;
        }

        UpdateSpeed.call(this);
        NextBlock.call(this);
    },

    QuickDrop() {
        if (!this.moveTimer) return;
        let nowTime = (new Date()).getTime();
        if (nowTime - this.blockCreateTime < 300) return;
        DropBlock.call(this, false);
    },

    MoveLeft() {
        if (!this.moveTimer) return;
        this.blockLogic.Move(true);
        this.DrawMoveBlock();
    },

    MoveRight() {
        if (!this.moveTimer) return;
        this.blockLogic.Move(false);
        this.DrawMoveBlock();
    },

    PauseGame() {
        if (!this.moveTimer || this.gamePause) return;
        OpenMoveTimer.call(this, false);
        this.gamePause = true;
        return true;
    },

    ContinueGame() {
        if (this.moveTimer || !this.gamePause) return;
        OpenMoveTimer.call(this, true);
        this.gamePause = false;
        return true;
    },
});
