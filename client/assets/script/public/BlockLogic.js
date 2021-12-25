// --------------------------------------------------------
// 方块游戏逻辑
// --------------------------------------------------------
// 会发出以下事件
// （1）DROP_BLOCKS
// （2）MERGE_BLOCKS_LIST
// --------------------------------------------------------
"use strict";

const EventEmitter = require('events');

function SetBlock(x, y, num, cnt, sec) {
    if (!this.CoordValid(x, y)) return;
    this.blockGrid[y][x] = {
        'num': num ? num : 0,
        'cnt': cnt ? cnt : 0,
        'sec': sec
    };
}

function ResetData() {
    this.moveBlockX = 0;
    this.moveBlockY = 0;
    this.moveBlockNum = 0;
    this.blockGrid = new Array();
    for (let iy = 0; iy < this.blockCountV; ++iy) {
        this.blockGrid[iy] = new Array();
        for (let ix = 0; ix < this.blockCountH; ++ix) {
            SetBlock.call(this, ix, iy);
        }
    }
}

function BlockLogic(blockCountH, blockCountV) {
    this.emitter = new EventEmitter();
    this.blockCountH = blockCountH;
    this.blockCountV = blockCountV;
    ResetData.call(this);
}

BlockLogic.prototype.on = function () {
    this.emitter.on.apply(this.emitter, arguments);
}

BlockLogic.prototype.emit = function () {
    this.emitter.emit.apply(this.emitter, arguments);
}

BlockLogic.prototype.Restart = function () {
    ResetData.call(this);
}

BlockLogic.prototype.GameOver = function () {
    for (let ix = 0; ix < this.blockCountH; ++ix) {
        if (this.HasBlock(ix, 0)) return true;
    }
    return false;
}

BlockLogic.prototype.CoordValid = function (x, y) {
    let inHCoord = (x >= 0 && x < this.blockCountH);
    let inVCoord = (y >= 0 && y < this.blockCountV);
    return inHCoord && inVCoord;
}

BlockLogic.prototype.HasBlock = function (x, y) {
    if (!this.CoordValid(x, y)) return true;
    return this.blockGrid[y][x].num > 0;
}

BlockLogic.prototype.GetDropEnd = function (x, y) {
    let dropEndY = y;
    for (let iy = y + 1; iy < this.blockCountV; ++iy) {
        if (this.HasBlock(x, iy)) break;
        dropEndY = iy;
    }
    return dropEndY;
}

BlockLogic.prototype.GetBlockGrid = function () {
    let blockGrid = new Array();
    for (let iy = 0; iy < this.blockCountV; ++iy) {
        blockGrid[iy] = new Array();
        for (let ix = 0; ix < this.blockCountH; ++ix) {
            blockGrid[iy][ix] = new Array();
            blockGrid[iy][ix].num = this.blockGrid[iy][ix].num;
            blockGrid[iy][ix].cnt = this.blockGrid[iy][ix].cnt;
            blockGrid[iy][ix].sec = this.blockGrid[iy][ix].sec;
        }
    }
    return blockGrid;
}

BlockLogic.prototype.GetMoveBlock = function () {
    return [this.moveBlockX, this.moveBlockY, this.moveBlockNum, this.moveBlockSec];
}

BlockLogic.prototype.Move = function (moveLeft) {
    if (this.GameOver()) return false;

    let setp = moveLeft ? -1 : +1;
    let newBlockX = this.moveBlockX + setp;
    let newBlockY = this.moveBlockY;

    if (this.HasBlock(newBlockX, newBlockY)) return false;
    this.moveBlockX = newBlockX, this.moveBlockY = newBlockY;
    return true;
}

BlockLogic.prototype.SetMoveBlock = function (x, y, num, sec) {
    this.moveBlockX = x, this.moveBlockY = y;
    this.moveBlockNum = num, this.moveBlockSec = sec;
}

BlockLogic.prototype.Drop = function (oneStep) {
    let dropBlockY = this.moveBlockY;
    if (oneStep) {
        dropBlockY++;
    } else {
        dropBlockY = this.GetDropEnd(this.moveBlockX, this.moveBlockY);
    }

    if (this.HasBlock(this.moveBlockX, dropBlockY)) {
        SetBlock.call(this, this.moveBlockX, this.moveBlockY, this.moveBlockNum, 1, this.moveBlockSec);
        return true;
    }

    this.moveBlockY = dropBlockY;
    let dropEndY = this.GetDropEnd(this.moveBlockX, this.moveBlockY);
    if (dropEndY === this.moveBlockY) {
        SetBlock.call(this, this.moveBlockX, this.moveBlockY, this.moveBlockNum, 1, this.moveBlockSec);
        return true;
    }

    return false;
}

BlockLogic.prototype.DropBlocks = function (blocks) {
    let dropStartBlocks = new Array(), dropEndBlocks = new Array();
    for (let iy = 0; iy < this.blockCountV; ++iy) {
        for (let ix = 0; ix < this.blockCountH; ++ix) {
            if (!this.HasBlock(ix, iy)) continue;
            let dropEndY = this.GetDropEnd(ix, iy);
            let diffCount = dropEndY - iy;
            if (diffCount <= 0) {
                let hasActiveBlock = false;
                for (let i = 0; i < blocks.length; ++i) {
                    if (blocks[i][0] != ix || blocks[i][1] != iy) continue;
                    hasActiveBlock = true;
                    break;
                }
                if (hasActiveBlock) {
                    dropStartBlocks.push([ix, iy, this.blockGrid[iy][ix]]);
                    dropEndBlocks.push([ix, iy, this.blockGrid[iy][ix]]);
                }
                continue;
            }
            for (let iiy = iy; iiy >= 0; --iiy) {
                if (!this.HasBlock(ix, iiy)) break;
                let newBlockY = iiy + diffCount;
                this.blockGrid[newBlockY][ix] = this.blockGrid[iiy][ix];
                dropStartBlocks.push([ix, iiy, this.blockGrid[iiy][ix]]);
                dropEndBlocks.push([ix, newBlockY, this.blockGrid[newBlockY][ix]]);
                SetBlock.call(this, ix, iiy);
            }
        }
    }
    this.emit('DROP_BLOCKS', dropStartBlocks, dropEndBlocks);
}

BlockLogic.prototype.MergeBlocks = function (blocks) {
    let mergeBlocksList = new Array();
    for (let i = 0; i < blocks.length; ++i) {
        let x = blocks[i][0], y = blocks[i][1];
        let mergeBlocks = this.DoMerge(x, y);
        if (mergeBlocks) mergeBlocksList.push(mergeBlocks);
    }
    this.emit('MERGE_BLOCKS_LIST', mergeBlocksList);
}

BlockLogic.prototype.DoMerge = function (x, y) {
    if (!this.HasBlock(x, y)) return;

    let sum10BlockList = new Array();
    let sum20BlockList = new Array();
    let sum23HBlockList = new Array();
    let sum23VBlockList = new Array();

    for (let rx = x; rx < this.blockCountH; ++rx) {
        for (let lx = 0; lx <= x; ++lx) {
            if (rx === lx) continue;
            let blockList = new Array();
            let sum = 0, hasNullBlock = false;
            for (let ix = lx; ix <= rx; ++ix) {
                if (!this.HasBlock(ix, y)) {
                    hasNullBlock = true;
                    break;
                }
                sum += this.blockGrid[y][ix].num;
                blockList.push([ix, y, this.blockGrid[y][ix]]);
            }
            if (hasNullBlock) {
                continue;
            } else if (sum === 10) {
                sum10BlockList.push(blockList);
            } else if (sum === 20) {
                sum20BlockList.push(blockList);
            } else if (sum === 23) {
                sum23HBlockList.push(blockList);
            }
        }
    }
    for (let by = y; by < this.blockCountV; ++by) {
        for (let ty = 0; ty <= y; ++ty) {
            if (by === ty) continue;
            let blockList = new Array();
            let sum = 0, hasNullBlock = false;
            for (let iy = ty; iy <= by; ++iy) {
                if (!this.HasBlock(x, iy)) {
                    hasNullBlock = true;
                    break;
                }
                sum += this.blockGrid[iy][x].num;
                blockList.push([x, iy, this.blockGrid[iy][x]]);
            }
            if (hasNullBlock) {
                continue;
            } else if (sum === 10) {
                sum10BlockList.push(blockList);
            } else if (sum === 20) {
                sum20BlockList.push(blockList);
            } else if (sum === 23) {
                sum23VBlockList.push(blockList);
            }
        }
    }

    let maxSize10BlockList = new Array();
    let maxSize20BlockList = new Array();
    let maxSize23HBlockList = new Array();
    let maxSize23VBlockList = new Array();

    if (sum23HBlockList.length > 0 || sum23VBlockList.length > 0) {
        for (let i = 0; i < sum23HBlockList.length; ++i) {
            let length = sum23HBlockList[i].length;
            if (i === 0 || length > maxSize23HBlockList.length) {
                maxSize23HBlockList = sum23HBlockList[i];
            }
        }
        for (let i = 0; i < maxSize23HBlockList.length; ++i) {
            let ix = maxSize23HBlockList[i][0];
            let iy = maxSize23HBlockList[i][1];
            SetBlock.call(this, ix, iy);
        }

        for (let i = 0; i < sum23VBlockList.length; ++i) {
            let length = sum23VBlockList[i].length;
            if (i === 0 || length > maxSize23VBlockList.length) {
                maxSize23VBlockList = sum23VBlockList[i];
            }
        }
        for (let i = 0; i < maxSize23VBlockList.length; ++i) {
            let ix = maxSize23VBlockList[i][0];
            let iy = maxSize23VBlockList[i][1];
            SetBlock.call(this, ix, iy);
        }
    } else if (sum20BlockList.length > 0) {
        for (let i = 0; i < sum20BlockList.length; ++i) {
            let length = sum20BlockList[i].length;
            if (i === 0 || length > maxSize20BlockList.length) {
                maxSize20BlockList = sum20BlockList[i];
            }
        }
        let blockCount = 0;
        for (let i = 0; i < maxSize20BlockList.length; ++i) {
            let ix = maxSize20BlockList[i][0];
            let iy = maxSize20BlockList[i][1];
            blockCount += maxSize20BlockList[i][2].cnt;
            SetBlock.call(this, ix, iy);
        }
        SetBlock.call(this, x, y, 20, blockCount);
    } else if (sum10BlockList.length > 0) {
        for (let i = 0; i < sum10BlockList.length; ++i) {
            let length = sum10BlockList[i].length;
            if (i === 0 || length > maxSize10BlockList.length) {
                maxSize10BlockList = sum10BlockList[i];
            }
        }
        let blockCount = 0;
        for (let i = 0; i < maxSize10BlockList.length; ++i) {
            let ix = maxSize10BlockList[i][0];
            let iy = maxSize10BlockList[i][1];
            blockCount += maxSize10BlockList[i][2].cnt;
            SetBlock.call(this, ix, iy);
        }
        SetBlock.call(this, x, y, 10, blockCount);
    } else {
        return;
    }

    return [x, y, maxSize10BlockList, maxSize20BlockList,
        maxSize23HBlockList, maxSize23VBlockList];
}

module.exports = BlockLogic;