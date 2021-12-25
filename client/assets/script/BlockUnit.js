cc.Class({
    extends: cc.Component,

    properties: {
        spriteFrameBlock: {
            default: [],
            type: cc.SpriteFrame,
        },
    },

    start() {

    },

    GetBlockNum() {
        return this.blockNum;
    },

    GetBlockCnt() {
        return this.blockCnt;
    },

    SetBlock(blockNum, blockCnt, blockSec, isOpacity) {
        if (blockNum < 0 || blockCnt < 0) return;
        if (blockNum > this.spriteFrameBlock.length) return;
        this.blockNum = blockNum, this.blockCnt = blockCnt;

        this.node.opacity = isOpacity ? 64 : 255;
        let sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = null;
        if (blockNum > 0) {
            let spriteFrame = this.spriteFrameBlock[blockNum - 1];
            sprite.spriteFrame = spriteFrame;
        }

        let nodeCnt = this.node.getChildByName('Count');
        nodeCnt.getComponent(cc.Label).string = String(blockCnt);
        nodeCnt.active = (blockCnt > 1);

        this.node.getChildByName('Second').active = Boolean(blockSec);
    },
});
