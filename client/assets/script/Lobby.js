const config = require('./Config');

cc.Class({
    extends: cc.Component,

    start() {
        let playBtnNode = this.node.getChildByName('PlayBtn');
        let viewRankNode = this.node.getChildByName('ViewRank');
        let gameRuleNode = this.node.getChildByName('GameRule');

        playBtnNode.on('click', function () {
            let playBtnMoveDistance = (this.node.width + playBtnNode.width) / 2;
            let actionPlayBtnMove = cc.moveTo(0.15, cc.v2(playBtnMoveDistance, playBtnNode.y));
            playBtnNode.runAction(actionPlayBtnMove);

            let viewRankMoveDistance = (this.node.width + viewRankNode.width) / 2;
            let actionViewRankMove = cc.moveTo(0.15, cc.v2(-viewRankMoveDistance, viewRankNode.y));
            viewRankNode.runAction(actionViewRankMove);

            let gameRuleMoveDistance = (this.node.height + gameRuleNode.height) / 2;
            let actionGameRuleMove = cc.moveTo(0.2, cc.v2(gameRuleNode.x, gameRuleMoveDistance));
            gameRuleNode.runAction(cc.sequence(actionGameRuleMove, cc.callFunc(function () {
                let jsGame = cc.find('Canvas').getComponent('Game');
                jsGame.UpdateLocation(false);
            })));
        }, this);

        viewRankNode.on(cc.Node.EventType.TOUCH_END, function () {
            let nodeRank = cc.find('Canvas').getChildByName('Rank');
            nodeRank.getComponent('Rank').Show();
        }, this);
    },
});
