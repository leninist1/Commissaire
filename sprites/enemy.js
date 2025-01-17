import Sprite from "./sprite.js";
import CollisionCalculator from "../utils/CollisionCalculator.js";
import HealthBar from "../utils/HealthBar.js";
export default class Enemy extends Sprite {
	/**
	 * 敌人类
	 * @param {object} position - 敌人的位置
	 * @param {array} collisionBlocks - 碰撞块数组
	 * @param {string} imageSrc - 敌人图像的路径
	 * @param {number} frameRate - 敌人动画的帧率
	 * @param {number} scale - 敌人的缩放比例
	 * @param {object} animations - 敌人动画对象
	 * @param {int} HP_limit - 敌人的最大生命值
	 * @param {int} HP - 敌人的生命值
	 * @param {int} damage - 敌人的攻击力
	 * @param {int} player_position - 玩家所在位置
	 * @param {boolean} closer - 敌人是否继续向玩家移动
	 * @param {int}  enemyLastAttackTime - 敌人攻击时刻
	 * @param {int}  enemyAttackCooldown - 敌人攻击冷却
	 * @param {int}  attackCount- 敌人攻击次数
	 * @param {bool} hasDamage - 敌人是否造成伤害
	 * @param {bool} showDead - 是否播放死亡动画
	 * @param {int} preHP -前一个状态的HP，用于判断是否受到伤害
	 * @param {bool} behurt - 是否受到伤害
	 * @param {int}  classID - 类别ID
	 */
	constructor({
		position,
		collisionBlocks,
		classID,
		HP_limit,
		imageSrc,
		frameRate,
		scale = 0.5,
		animations,
	}) {
		super({ imageSrc, frameRate, scale });
		this.jumpingCount = 0;
		this.position = position;
		this.velocity = {
			x: 0,
			y: 1,
		};
		this.collisionBlocks = collisionBlocks;
		this.hitbox = {
			position: {
				x: this.position.x,
				y: this.position.y,
			},
			width: 10,
			height: 10,
		};
		this.animations = animations;
		this.classID = classID;
		this.healthBar = new HealthBar(this);
		this.lastDirection = 'left';
		this.enemyAttackCooldown= 2000;
		this.enemyLastAttackTime = Date.now();
		this.attackCount = 0;
		this.showDead = true;
		this.behurt = true;
		for (let key in this.animations) {
			const image = new Image();
			image.src = this.animations[key].imageSrc;

			this.animations[key].image = image;
		}

		this.camerabox = {
			position: {
				x: this.position.x,
				y: this.position.y,
			},
			width: 200,
			height: 80,
		};
		this.HP_limit = HP_limit;
		this.HP = this.HP_limit;
		this.preHP = this.HP;
		this.damage = 0.2;
	}

	/*敌人属性组方法*/
	get_HP_limit() {
		return this.HP_limit;
	}
	set_HP_limit(value) {
		this.HP_limit = value;
	}
	get_HP() {
		return this.HP;
	}
	set_HP(value) {
		this.HP = value;
	}
	get_damage() {
		return this.damage;
	}
	set_damage(value) {
		this.damage = value;
	}
	get_position() {
		return this.position;
	}
	get_hitbox() {
		return this.hitbox;
	}
	/**
	 * 尝试跳跃
	 */
	try2Jump() {
		this.#jump();
		
	}
	canEnemyAttack() {
		return Date.now() >= this.enemyLastAttackTime + this.enemyAttackCooldown;
	  }
	//判断玩家是否在攻击范围内
	isPlayerInAttackRange(player)
	{
		return Math.abs(player.position.x-this.position.x) <= 40
				&& 	Math.abs(player.position.y-this.position.y) <=20
	}
	/**
	 * 攻击方法
	 */
	attack(player) {
		console.log(this.attackCount)
		if(this.attackCount%3!=0)
		{
			if(this.lastDirection=='right')
				this.switchSprite('Attack1_right');
			else 
				this.switchSprite('Attack1_left');
		}
		else
		{
			if(this.lastDirection=='right')
				this.switchSprite('Attack2_right');
			else 
				this.switchSprite('Attack2_left');
		}
		if(this.isPlayerInAttackRange(player))
		{
			if(player.HP>0 && !this.hasDamage)
			{
				this.hasDamage = true
				if(this.damage>player.HP)
				{
					player.HP = 0
				}
				else
				{
					player.HP -= this.damage
					if(player.lastDirection=='right')
						player.switchSprite('TakeHit_right')
					else
						player.switchSprite('TakeHit_left')
				}
			}
		}
		this.hasDamage = false
	}
		

	
	

	/**
	 * 跳跃方法
	 */
	#jump() {
		this.velocity.y = -2.0;
		this.jumpingCount++;
	}

	/**
	 * 跳跃重置方法
	 */
	#jumpResets() {
		this.jumpingCount = 0;
	}

	/**
	 *敌人AI
	 */
	enemy_AI(player_position, player) {
		//锁定玩家位置
		if (this.position.x <player_position.x) {
			this.lastDirection = 'right';
		} else if (this.position.x > player_position.x) {
			this.lastDirection = 'left';
		}
		
		//玩家在视野范围内，像角色移动
		if (CollisionCalculator.hasCollision({object1:this.camerabox, object2:player.hitbox})) {
			this.closer = true
			//靠经一段距离后，不再向角色移动
			
			if((this.position.x-player_position.x)<30&&(this.position.x-player_position.x)>-30)
			{
				//console.log(this.position.x-player_position.x)
				this.velocity.x = 0;
				switch(this.lastDirection)
				{
					case 'right':
						this.switchSprite('Idle')
						break;
					case 'left':
						this.switchSprite('IdleLeft')
						break;
				}
				this.closer = false
				if(this.canEnemyAttack())
				{
					console.log('attack')
					setTimeout(() => {
						this.enemyLastAttackTime = Date.now();
						this.attackCount++;
		
					}, 500); //500单位时间大约播放完一次攻击动画
					this.attack(player);
				}
			}

			if(this.closer)
			{
				//向玩家移动
				switch (this.lastDirection) {
				case 'right':
					this.switchSprite('Run')
					this.velocity.x = 0.8
					this.lastDirection = 'right'
					
					break;
				case 'left':
					this.switchSprite('RunLeft')
					this.velocity.x = -0.8
					this.lastDirection = 'left'
					
					break;
				}
			}
			//控制跳跃(动画)
			if (this.velocity.y < 0) {
			
				if (this.lastDirection == 'right') this.switchSprite('Jump')
				else this.switchSprite('JumpLeft')
			
			}
			else if (this.velocity.y > 0) {

				if (this.lastDirection == 'right') this.switchSprite('Fall')
				else this.switchSprite('FallLeft')
			}
					
		
		}
		else
		{
			this.velocity.x = 0;
			switch(this.lastDirection)
			{
				case 'right':
					this.switchSprite('Idle')
					break;
				case 'left':
					this.switchSprite('IdleLeft')
					break;
			}
			
		}
	}

	/**
	 * 切换精灵方法
	 * @param {string} key - 精灵的键名
	 */
	switchSprite(key) {
		if (this.image == this.animations[key].image || !this.loaded) {
			return;
		}

		this.image = this.animations[key].image;
		this.frameBuffer = this.animations[key].frameBuffer;
		this.frameRate = this.animations[key].frameRate;
		
	}

	/**
	 * 更新camerabox
	 */
	updateCamerabox() {
		this.camerabox = {
			position: {
				x: this.position.x - 50,
				y: this.position.y,
			},
			width: 200,
			height: 80,
		};
	}

	/**
	 * 检查水平方向上的碰撞
	 */
	checkforHorizontalCanvasCollision() {
		if (
			this.hitbox.position.x + this.hitbox.width + this.velocity.x >= 576 ||
			this.hitbox.position.x + this.velocity.x <= 0
		) {
			this.velocity.x = 0; // 不能通过边缘
			return true;
		}
		else return false;
	}
	
	/**
	 * 是否需要向左平移相机
	 * @param {object} canvas - 画布对象
	 * @param {object} camera - 相机对象
	 */
	shouldPanCameraToLeft({ canvas, camera }) {
		const cameraboxRightSide = this.camerabox.position.x + this.camerabox.width;

		if (cameraboxRightSide >= 576) return;

		if (cameraboxRightSide >= canvas.width / 4 + Math.abs(camera.position.x)) {
			camera.position.x -= this.velocity.x;
		}
	}

	/**
	 * 是否需要向右平移相机
	 * @param {object} canvas - 画布对象
	 * @param {object} camera - 相机对象
	 */
	shouldPanCameraToRight({ canvas, camera }) {
		if (this.camerabox.position.x <= 0) return;
		if (this.camerabox.position.x <= Math.abs(camera.position.x)) {
			camera.position.x -= this.velocity.x;
		}
	}

	/**
	 * 是否需要向下平移相机
	 * @param {object} canvas - 画布对象
	 * @param {object} camera - 相机对象
	 */
	shouldPanCameraDown({ canvas, camera }) {
		if (this.camerabox.position.y + this.velocity.y <= 0) return;

		if (this.camerabox.position.y <= Math.abs(camera.position.y) + canvas.height / 4) {
			camera.position.y -= this.velocity.y;
		}
	}

	/**
	 * 是否需要向上平移相机
	 * @param {object} canvas - 画布对象
	 * @param {object} camera - 相机对象
	 */
	shouldPanCameraUp({ canvas, camera }) {
		if (
			this.camerabox.position.y + this.camerabox.height + this.velocity.y >=
			432
		)
			return;

		if (
			this.camerabox.position.y + this.camerabox.height >=
			Math.abs(camera.position.y) + canvas.height / 4
		) {
			camera.position.y -= this.velocity.y;
		}
	}

	/**
	 * 更新方法
	 */
	update() {
		this.updateFrames();
		this.updateHitbox();

		this.updateCamerabox();
		// c.fillStyle = 'rgba(0, 0, 255, 0.2)'
		// c.fillRect (
		// 	this.camerabox.position.x,
		// 	this.camerabox.position.y,
		// 	this.camerabox.width,
		// 	this.camerabox.height )

		//绘制图像
		c.fillStyle = "rgba(0, 255, 0, 0.2)";
		c.fillRect(this.position.x, this.position.y, this.width, this.height);

		c.fillStyle = "rgba(255, 0, 0, 0.2)";
		c.fillRect(
			this.hitbox.position.x,
			this.hitbox.position.y,
			this.hitbox.width,
			this.hitbox.height
		);
	
		this.draw();

		this.position.x += this.velocity.x;
		this.updateHitbox();
		this.checkForHorizontalCollisions(); //注意序列
		this.applyGravity();
		this.updateHitbox();
		this.checkForVerticalCollisions();
		this.healthBar.update();
    	this.healthBar.draw(c);
	}

	/**
	 * 更新hitbox
	 */
	updateHitbox() {
		this.hitbox = {
			position: {
				x: this.position.x + 35,
				y: this.position.y + 26,
			},
			width: 14,
			height: 27,
		};
	}

	/**
	 * 检查水平碰撞
	 */
	checkForHorizontalCollisions() {
		for (let i = 0; i < this.collisionBlocks.length; i++) {
			const collisionBlock = this.collisionBlocks[i];

			if (
				CollisionCalculator.hasCollision({
					object1: this.hitbox,
					object2: collisionBlock,
				})
			) {
				if (this.velocity.x >= 0) {
					this.velocity.x = 0;
					const offset =
						this.hitbox.position.x - this.position.x + this.hitbox.width;
					this.position.x = collisionBlock.position.x - offset - 0.01; // 减去最后一个
					this.try2Jump();
				}

				if (this.velocity.x < 0) {
					this.velocity.x = 0;

					const offset = this.hitbox.position.x - this.position.x;
					this.position.x =
						collisionBlock.position.x + collisionBlock.width - offset + 0.01; // 加上最后一个
					this.try2Jump();
				}
			}
		}
	}

	/**
	 * 应用重力
	 */
	applyGravity() {
		this.velocity.y += gravity;
		this.position.y += this.velocity.y;
	}

	/**
	 * 检查垂直碰撞
	 */
	checkForVerticalCollisions() {
		for (let i = 0; i < this.collisionBlocks.length; i++) {
			const collisionBlock = this.collisionBlocks[i];

			if (
				CollisionCalculator.hasCollision({
					object1: this.hitbox,
					object2: collisionBlock,
				})
			) {
				if (this.velocity.y >= 0) {
					this.velocity.y = 0;
					this.#jumpResets();
					const offset =
						this.hitbox.position.y - this.position.y + this.hitbox.height;

					this.position.y = collisionBlock.position.y - offset - 0.01; // 减去最后一个
					break;
				}

				if (this.velocity.y < 0) {
					this.velocity.y = 0;

					const offset = this.hitbox.position.y - this.position.y;
					this.position.y =
						collisionBlock.position.y + collisionBlock.height - offset + 0.01; // 加上最后一个
					break;
				}
			}
		}
	}
}
