// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
const {ccclass, property} = cc._decorator;

@ccclass
export default class TouchHeroControl extends cc.Component {

    @property(cc.Node)
    moveNode: cc.Node = null;
    @property(cc.Node)
    jumpNode: cc.Node = null;

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property(cc.Vec2)
    speed: cc.Vec2 = cc.v2(0,0);

    @property(cc.Vec2)
    maxSpeed: cc.Vec2 = cc.v2(2000,2000);

    @property(cc.Integer)
    gravity: number = -1000;

    @property(cc.Integer)
    drag: number = 1000;

    @property(cc.Integer)
    direction: number = 0;

    @property(cc.Integer)
    jumpSpeed: number = 300;
    collisionX: number = 0;
    collisionY: number = 0;
    prePosition = cc.v2();
    preStep = cc.v2();
    startLocation = cc.v2();
    endLocation = cc.v2();
    jumping = false;
    touched = false;
    animationComponent = null;

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        cc.director.getCollisionManager().enabled = true;
        cc.director.getCollisionManager().enabledDebugDraw=true;
        console.log("enter load");
        this.animationComponent = this.getComponent(cc.Animation);

        this.node.parent.on(cc.Node.EventType.TOUCH_START,this.onPressed,this);
        this.node.parent.on(cc.Node.EventType.TOUCH_MOVE,this.onMoved,this);
        this.node.parent.on(cc.Node.EventType.TOUCH_END,this.onReleased,this);
    }
    
    onDisable(){
        cc.director.getCollisionManager().enabled = false;
        cc.director.getCollisionManager().enabledDebugDraw = false;
    }

    onPressed(event){
        this.touched = true;
        this.startLocation = event.getLocation();
    }

    onMoved(event){
        if (!this.touched) {
            return;
        }
        this.endLocation = event.getLocation();
        var delta = cc.v2(this.endLocation.x-this.startLocation.x,this.endLocation.y-this.startLocation.y);
        console.log(delta);

        if (delta.x < 0) {
            this.direction = -1;
        }
        if (delta.x > 0) {
            this.direction = 1;
        }

        if (delta.y > 0 && !this.jumping) {
            this.jumping = true;
            this.animationComponent.play('jump');
            this.speed.y = this.jumpSpeed;
        }
        this.startLocation = this.endLocation;
    }

    onReleased(event){
        this.endLocation = event.getLocation();
        var delta = cc.v2(this.endLocation.x-this.startLocation.x,this.endLocation.y-this.startLocation.y);
        console.log(delta);

        this.direction = 0;

        if (delta.y > 0 && !this.jumping) {
            this.jumping = true;
            this.speed.y = this.jumpSpeed;
        }
        this.touched = false;
    }

    onCollisionEnter(other, self) {
        this.node.color = cc.Color.RED;

        // 1st step
        // get pre aabb, go back before collision
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();
        
        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();

        // 2nd step
        // forward x-axis, check whether collision on x-axis
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        var transParent = this.node.parent.getNodeToWorldTransformAR();
        var tranParent = cc.v2(transParent.tx,transParent.ty);
        // console.log("tramsParent.x",tranParent.x,"transparent.y",tranParent.y);
        var appX = selfAabb.width*this.node.anchorX;
        var appY = selfAabb.height*this.node.anchorY;



        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {
                this.node.x = otherPreAabb.xMax - tranParent.x + appX;
                this.collisionX = -1;
            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                this.node.x = otherPreAabb.xMin - selfPreAabb.width - tranParent.y + appX;
                this.collisionX = 1;
            }

            this.speed.x = 0;
            other.touchingX = true;
            return;
        }

        // 3rd step
        // forward y-axis, check whether collision on y-axis
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                this.animationComponent.play('stand');
                this.node.y = otherPreAabb.yMax - tranParent.y + appY;
                this.jumping = false;
                this.collisionY = -1;
            }
            else if (this.speed.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin)) {
                this.node.y = otherPreAabb.yMin - selfPreAabb.height - tranParent.y + appY;
                this.speed.y = 0;
                this.collisionY = 1;
            }
            this.speed.y = 0;
            other.touchingY = true;
        }
    }

    onCollisionStay(other, self) {
        if (this.collisionY === -1) {
            if (other.node.group === 'Platform') {
                var motion = other.node.getComponent('PlatformMotion');
                if (motion) {
                    this.node.x += motion._movedDiff;
                }
            }
        }
    }

    onCollisionExit(other) {
        if (other.touchingX) {
            this.collisionX = 0;
            other.touchingX = false;
        }
        else if (other.touchingY) {
            other.touchingY = false;
            this.collisionY = 0;
            this.jumping = true;
        }
    }

    update (dt) {
        if (this.collisionY == 0) {
            this.speed.y += this.gravity*dt;
            if (Math.abs(this.speed.y) > this.maxSpeed.y) {
                this.speed.y = this.speed.y > 0 ? this.maxSpeed.y:-this.maxSpeed.y;
            }
        }
        if (this.direction === 0) {
            if (this.speed.x > 0) {
                this.speed.x -= this.drag*dt;
                if (this.speed.x <= 0) this.speed.x = 0;
            }
            else if (this.speed.x < 0) {
                this.speed.x += this.drag*dt;
                if (this.speed.x >= 0) this.speed.x = 0;
            }
        }
        else{
            this.speed.x += (this.direction>0?1:-1)*this.drag*dt;
            if (Math.abs(this.speed.x) > this.maxSpeed.x) {
                this.speed.x = this.speed.x > 0 ?this.maxSpeed.x:-this.maxSpeed.x;
            }
        }

        if (this.speed.x * this.collisionX > 0) {
            this.speed.x = 0;
        }

        this.prePosition.x = this.node.x;
        this.prePosition.y = this.node.y;
        this.preStep.x = this.speed.x*dt;
        this.preStep.y = this.speed.y*dt;
        this.node.x += this.speed.x*dt;
        this.node.y += this.speed.y*dt;
    }
}
