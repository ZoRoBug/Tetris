const config = require('./Config');

cc.Class({
    extends: cc.Component,

    properties: {
        prefabBlockBox: {
            default: null,
            type: cc.Prefab,
        },
    },

    start() {
        this.blockBox = cc.instantiate(this.prefabBlockBox);
        let nodeBlockBox = cc.find('Main/View/BlockBox', this.node);
        nodeBlockBox.addChild(this.blockBox);

        let nodeLeftLeft = cc.find('Oper/LeftLeft', this.node);
        nodeLeftLeft.on(cc.Node.EventType.TOUCH_END, function () {
            this.MoveLeft();
        }, this);
        let nodeRightLeft = cc.find('Oper/RightLeft', this.node);
        nodeRightLeft.on(cc.Node.EventType.TOUCH_END, function () {
            this.MoveLeft();
        }, this);

        let nodeLeftRight = cc.find('Oper/LeftRight', this.node);
        nodeLeftRight.on(cc.Node.EventType.TOUCH_END, function () {
            this.MoveRight();
        }, this);
        let nodeRightRight = cc.find('Oper/RightRight', this.node);
        nodeRightRight.on(cc.Node.EventType.TOUCH_END, function () {
            this.MoveRight();
        }, this);

        let nodeLeftDrop = cc.find('Oper/LeftDrop', this.node);
        nodeLeftDrop.on(cc.Node.EventType.TOUCH_END, function () {
            this.QuickDrop();
        }, this);
        let nodeRightDrop = cc.find('Oper/RightDrop', this.node);
        nodeRightDrop.on(cc.Node.EventType.TOUCH_END, function () {
            this.QuickDrop();
        }, this);

        let nodePause = cc.find('Oper/Pause', this.node);
        nodePause.on(cc.Node.EventType.TOUCH_END, function () {
            this.PauseGame();
        }, this);
        let nodeContinue = cc.find('Oper/Continue', this.node);
        nodeContinue.on(cc.Node.EventType.TOUCH_END, function () {
            this.ContinueGame();
        }, this);

        this.UpdateGameScore();
        setInterval(function () {
            this.UpdateGameScore();
        }.bind(this), 500);

        this.UpdateGameState(false);
    },

    RestartGame() {
        this.UpdateGameState(false);
        this.blockBox.getComponent('BlockBox').RestartGame();
    },

    PlayEnterAction() {
        let nodeMainArea = cc.find('Main', this.node);
        let nodeView = cc.find('Main/View', this.node);
        let oldX = nodeView.x, oldY = nodeView.y;
        nodeView.y = oldY + nodeMainArea.height;
        let actionMove = cc.moveTo(0.3, cc.v2(oldX, oldY));
        nodeView.runAction(cc.sequence(actionMove, cc.callFunc(function () {
            let itemName = config.itemName.rule;
            if (cc.sys.localStorage.getItem(itemName)) {
                this.RestartGame();
                return;
            }
            cc.sys.localStorage.setItem(itemName, true);
            g_msgbox.Show(null, config.ruleTips, g_msgbox.MB_OK, function () {
                this.RestartGame();
            }.bind(this), { height: 440 });
        }.bind(this))));
    },

    UpdateGameScore() {
        let jsBlockBox = this.blockBox.getComponent('BlockBox');
        let nodeScore = cc.find('Main/View/GameScore', this.node);
        let labelScore = nodeScore.getComponent(cc.Label);
        let score = jsBlockBox.GetGameScore();
        labelScore.string = score ? String(score) : '0';
    },

    UpdateGameState(isPause) {
        cc.find('Oper/Pause', this.node).active = !isPause;
        cc.find('Oper/Continue', this.node).active = isPause;
        cc.find('Main/View/PauseTips', this.node).active = isPause;
    },

    MoveLeft() {
        this.blockBox.getComponent('BlockBox').MoveLeft();
    },

    MoveRight() {
        this.blockBox.getComponent('BlockBox').MoveRight();
    },

    QuickDrop() {
        this.blockBox.getComponent('BlockBox').QuickDrop();
    },

    PauseGame() {
        if (this.blockBox.getComponent('BlockBox').PauseGame()) {
            this.UpdateGameState(true);
        }
    },

    ContinueGame() {
        if (this.blockBox.getComponent('BlockBox').ContinueGame()) {
            this.UpdateGameState(false);
        }
    },
});
