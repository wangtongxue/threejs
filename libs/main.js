    var scene;
    var camera;
    var renderer;
    var light1, light2, light3, light4, itemLoading ;
    var controls;

    var intersected; // ww- 鼠标事件 射线第一个相交的模型
    var room_obj = null,
        floor_obj = null,
        floor_opa_obj = null; // ww- 存储园区模型
    var rooms = []; // ww- 用来存储楼层

    var raycaster = new THREE.Raycaster(); // ww- 射线相交
    var mouse = new THREE.Vector2(); // ww- 配合射线相交的鼠标坐标

    var timer, x = 1; // ww- 这里是点击abc用到的
    var objects = []; // ww- 最终就只有两个obj
    var text_objects = []; // ww- 存储文本sprite
    var a = 0;

    var current_floor, current_room; // ww- 存储当前点击的这座楼的内部楼层数据

    //初始化函数
    function init() {
        renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('mainCanvas')
        });
        renderer.setClearColor(0xffffff);
        renderer.setSize(window.innerWidth, window.innerHeight);

        scene = new THREE.Scene();
        // ww- camera = new THREE.OrthographicCamera(-5, 5, 3.75, -3.75, 0.1, 1000);
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(50, 140, 190);
        // ww- camera.position.set(10,100,60);
        camera.lookAt(scene.position);
        scene.add(camera);

        initLight(); // ww- ww-灯光
        createGround(); // ww- ww- 地板
        createSky();
				
				itemLoading = 0;
        createLoader({
            name1: 'floor_0612.mtl',
            name2: 'floor_0612.obj',
            x: -260,
            y: -10,
            z: 250,
            x1: 0.0127,
            y1: 0.0127,
            z1: 0.0127
        }); // ww- 加载loader  // ww- ww-加载模型
        createLoader({
            name1: 'room_0612.mtl',
            name2: 'room_0612.obj',
            x: -260,
            y: -10,
            z: 250,
            x1: 0.0127,
            y1: 0.0127,
            z1: 0.0127
        }); // ww- 加载loader  // ww- ww-加载模型
        createLoader({ // ww- 重新创建园区opacity房子
            name1: '0702.mtl',
            name2: '0702.obj',
            x: -260,
            y: -10,
            z: 250,
            x1: 0,
            y1: 0,
            z1: 0
        }); // ww- 加载loader  // ww- ww-加载模型
        sprites_arr.forEach(function (i) {
            createSprite(i);
        })

        setControls(); // ww- ww- 控制
        document.body.appendChild(renderer.domElement);
        renderer.shadowMap.enabled = true;
        renderer.domElement.addEventListener("mousemove", onDocumentMouseMove, false)
    }
    var cam_z = 190;



    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //新建一个三维单位向量 假设z方向就是0.5
        //根据照相机，把这个向量转换到视点坐标系
        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
        //在视点坐标系中形成射线,射线的起点向量是照相机， 射线的方向向量是照相机到点击的点，这个向量应该归一标准化。
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        //射线和模型求交，选中一系列直线
        var intersects = raycaster.intersectObjects(objects);
        //			console.log(intersects)
        //			console.log('imtersrcts=' + intersects);
        if (intersects.length > 0) {
            //选中第一个射线相交的物体
            SELECTED = intersects[0].object;
            intersected = intersects[0].object;
            document.body.style["cursor"] = 'pointer';
            //			intersected.material.opacity = 1;

            intersected.material.color.setHex(0xff0000);
            renderer.domElement.onclick = function () {
                if (intersected.oneid != 2) { // ww- 只点c才会进入加载状态
                    return
                }
                controls.reset(); // ww- ww- 目的：平移到任何地方 都初始化为刚开始的位置
                timer_move1(floor_num_data[intersected.oneid], floor_sprite_data[intersected.oneid]);
                controls.update();
                current_floor = floor_num_data[intersected.oneid]; // ww- ww-将当前点击的这栋楼的数据存储 点击楼层时调用
                current_room = floor_sprite_data[intersected.oneid]; // ww- ww-将当前点击的这栋楼的楼层数据存储 点击楼层时调用
            }
        } else if (intersected) {
            intersected.material.color.setHex(0xffffff);
            intersected = null;
            document.body.style.cursor = 'auto';
            renderer.domElement.onclick = null;
        }
    }

    function timer_move1(opt, text_opt) {
        //		controls.object.translateX = -26.427700711343352;
        //		controls.object.translateY = 24.163346965686895;
        //		controls.object.translateZ = -25.14130616623456;

        // ww-      console.log(controls.object.translateX)
        // ww-      console.log(delta)

        //		startMove()
        //		controls.target = new THREE.Vector3(-27, 17, -27.4);
        //		controls.update();

        controls.target = new THREE.Vector3(opt[0].target.x, opt[0].target.y, opt[0].target.z); // ww- 下边的timer用到的
        controls.update();

        timer = setInterval(function () { // ww- 这个定时器为了拉近视角
            controls.PAN(opt[0].controls.PAN.x, opt[0].controls.PAN.y);
            controls.R_Left(opt[0].controls.R_left);
            controls.IN(opt[0].controls.IN);
            controls.update();

            if (controls.object.position.x <= opt[0].target_point) { // ww- ww-缩放运动到当前目标点 则停止运动
                clearInterval(timer);
                timer = setInterval(function () {
                    x -= 0.08; // ww- x的值为opacity

                    room_obj.children.forEach(function (mesh) {
                        if (mesh.material.forEach) {
                            mesh.material.forEach(function (material) {
                                material.transparent = true;
                                material.opacity = x;
                            })
                        }
                    })
                    if (x <= 0) {
                        x = 1;
                        text_opt[0].forEach(function (i) {
                            createTextSprite(i);
                        })
                        clearInterval(timer);
                        scene.remove(room_obj);

                        objects.forEach(function (sprite) {
                            sprite.material.opacity = 0;
                        })

                        createLoader({
                            name1: opt[0].name1,
                            name2: opt[0].name2,
                            x: opt[0].x,
                            y: opt[0].y,
                            z: opt[0].z,
                            x1: opt[0].x1,
                            y1: opt[0].y1,
                            z1: opt[0].z1
                        }); // ww- 加载loader

                        floor_opa_obj.scale.set(0.0127, 0.0127, 0.0127); // ww- 对透明的房子进行显示缩放

                        $("#btn").css("display", "block");
                        $("#btn-back").css("display", "block");
                        var str = '';
                        for (var i = 0; i < opt.length - 1; i++) {
                            str += "<button class='btn btn-default'>" + (i + 1) + "</button>";
                        }
                        $("#btn").append(str);
                    }
                }, 30);
            }
        }, 30)
    }
    var click_timer = null,
        n, room_timer, btn_onoff = false;
    $("#btn").on("click", function (e) { // ww- ww-点击触发的事件处理函数
        if (!n && parseInt(e.target.innerHTML) == 1 || btn_onoff) {
            return;
        }
        if (Number(e.target.innerHTML) == NaN || parseInt(e.target.innerHTML) == n) {
            return;
        } else {
            n = parseInt(e.target.innerHTML);
            btn_onoff = true;

            room_timer = setInterval(function () {
                rooms[0].scale.x -= 0.01;
                rooms[0].scale.y -= 0.01;
                rooms[0].scale.z -= 0.01;
                rooms[0].position.x += 0.28;
                rooms[0].position.z -= 0.22;

                if (rooms[0].scale.x <= 0.00000) {
                	btn_onoff = false;
                    clearInterval(room_timer);
                    scene.remove(rooms[0]);
                    rooms = [];
                    text_objects.forEach(function (sprite) {
                        scene.remove(sprite);
                    })
                    // ww- 当运动结束之后，才会去重新加载新一层的模型和文字
                    createLoader({ // ww- 加载当前点击的那一层的室内
                        name1: current_floor[n - 1].name1,
                        name2: current_floor[n - 1].name2,
                        x: current_floor[n - 1].x,
                        y: current_floor[n].y,
                        z: current_floor[n].z,
                        x1: current_floor[n].x1,
                        y1: current_floor[n].y1,
                        z1: current_floor[n].z1
                    }); // ww- 加载loader
                    current_room[n - 1].forEach(function (i) { // ww- 添加每一层的房间的文字
                        createTextSprite(i);
                    })
                }
            }, 20)
        }
    })

    $("#btn-back").on("click", function () {
        n = 0; // ww- 点击楼层的按钮还原
        $("#btn").html(''); // ww- 按钮置空，根据数据再重新生成
        $("#btn").css("display", "none"); // ww- 隐藏按钮
        $("#btn-back").css("display", "none"); // ww- 隐藏返回按钮
        controls.reset(); // ww- 回到初始状态位置
        floor_opa_obj.scale.set(0, 0, 0); // ww-对透明的房子回归初始状态

        rooms.forEach(function (room) { // ww- 移除掉场景中存在的楼层
            scene.remove(room);
            //			rooms.shift();
        })
        text_objects.forEach(function (sprite) { // ww- 移除掉文本精灵
            scene.remove(sprite);
        })
        text_objects = [];
        createLoader({ // ww- 重新创建园区模型
            name1: 'room_0612.mtl',
            name2: 'room_0612.obj',
            x: -260,
            y: -10,
            z: 250,
            x1: 0.0127,
            y1: 0.0127,
            z1: 0.0127
        }); // ww- 加载loader  // ww- ww-加载模型

        objects.forEach(function (sprite) {
            sprite.material.opacity = 1;
        })
        rooms = []; // ww- 置空是为了返回之后点击btn还能够有缩放的效果
    })

    function startMove(iTargetX, iTargetY, iTargetZ) {
        clearInterval(timer);
        timer = setInterval(function () {
            controls.object.position.x -= 1.553;
            controls.object.position.y -= 2.32;
            controls.object.position.z -= 4.3;
            if (controls.object.position.x <= -26.427700711343352 && controls.object.position.y <=
                24.163346965686895 && controls.object.position.z <= -25.14130616623456) {
                clearInterval(timer);
                controls.object.position.x = -26.427700711343352
                controls.object.position.y = 24.163346965686895;
                controls.object.position.z = -25.14130616623456;
            }
        }, 0)
    };

    /*
     *camera:相机
     *angle：旋转角度
     *segs:分段，即圆弧对应的路径分为几段
     *during：动画执行的时间
     */
    function myCameraTween(camera, angle, segs, during) { // ww- ww- 旋转动画

        var x = camera.position.x;
        var y = camera.position.y;
        var z = camera.position.z;

        var endPosArray = new Array();

        var perAngle = angle / segs;

        for (var i = 1; i <= segs; i++) {
            var endPos = {
                "x": z * Math.sin(i * perAngle) + x * Math.cos(i * perAngle),
                "y": y,
                "z": z * Math.cos(i * perAngle) - x * Math.sin(i * perAngle)
            };

            endPosArray.push(endPos);
        }


        var flag = 0;
        var id = setInterval(function () {
            if (flag == segs) {
                clearInterval(id);
            } else {
                camera.position.x = endPosArray[flag].x;
                camera.position.y = endPosArray[flag].y;
                camera.position.z = endPosArray[flag].z;
                flag++;
            }

        }, 0);
    }

    function createSprite(opt) {
        var spriteMaterial = new THREE.SpriteMaterial({
            transparent: true,
            opacity: 1,
            map: THREE.ImageUtils.loadTexture(opt.src)
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(opt.posX, opt.posY, opt.posZ);
        sprite.scale.set(4, 4);
        sprite.oneid = a;
        a++;
        objects.push(sprite);
        scene.add(sprite);
    }

    function makeTextSprite(message) { // ww- ww- 创建文字精灵
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        //			    context.strokeStyle = "red";
        //			    context.strokeRect(10,10,200,100);
        context.font = "bold 20px 黑体";

        context.fillStyle = "rgba(0,0,0, 1.0)";
        //				context.textAlign = "center";
        context.fillText(message, 140, 70);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: false
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 5, 5);
        return sprite;
    }

    function createTextSprite(opt) {
        var sprite = makeTextSprite(opt.message);
        sprite.position.set(opt.x, opt.y, opt.z);
        text_objects.push(sprite);
        scene.add(sprite);
    }

    function initLight() {
        //light init
        var target = new THREE.Object3D();
        target.position.set(0, -200, 0);

        // light1 = new THREE.DirectionalLight(0xffffff,0.3);
        // light1.position.set(150, 200, 500);

        light2 = new THREE.DirectionalLight(0xffffff, 0.9);
        // light2.position.set(450, 320, 1200);
        light2.position.set(200, 360, 200);

        light2.castShadow = true;
        // light3.castShadow=true;

        light2.shadowMapHeight = 5000;
        light2.shadowMapWidth = 5000;
        light2.shadowCameraVisible = true;
        light2.shadowCameraNear = 0.01;
        light2.shadowCameraFar = 2000;
        light2.shadowCameraLeft = -300;
        light2.shadowCameraRight = 300;
        light2.shadowCameraTop = 100;
        light2.shadowCameraBottom = -200;
        light2.shadowDarkness = 0.9;

        scene.add(light2);

        // var axisHelper = new THREE.AxisHelper( 100 );
        // scene.add( axisHelper );

        // ylp--增加环境光
        var light = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(light);

        // spotLight0.castShadow=true;
        renderer.shadowMapSoft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // var directionalLightHelper = new THREE.DirectionalLightHelper( light2 );
        // scene.add( directionalLightHelper );

    }

    function createGround() {
        var groundGeo = new THREE.PlaneBufferGeometry(100000, 100000);
        var groundMat = new THREE.MeshPhongMaterial; //( { color: 0x9BCD9B, specular: 0x9BCD9B } );
        groundMat.color.setHSL(0.23, 0.3, 0.55);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -10;
        scene.add(ground);
        ground.receiveShadow = true;
    }

    /*function createLoader(){
    	//加载模型
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('obj/5/');
        mtlLoader.load('0603.mtl', function (materials) {
            materials.preload();
            //材料包预加载之后再加载obj模型
            //OBJ model的引入
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('obj/5/');
            objLoader.load('0603.obj', function (obj) {
                obj.castShadow=true;
                obj.position.y = -10;
                obj.position.x = -150;
                obj.position.z = 100;

                obj.rotation.y=0.08*Math.PI;
                obj.scale.set(0.008, 0.008, 0.008);
                scene.add(obj);
            }, onProgress, onError);
        });
        //onProgress onError
        var onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded')
            }
        };
        var onError = function (xhr) {
            console.log(xhr.readyState);
        };
    }*/
		progress(0);
		function progress(num){ // ww- 这里是进度条的代码块
			$('.progressbar').each(function () {
				var t = $(this);
				var dataperc = num,
						barperc = Math.round(dataperc * 5.56);
				t.find('.bar').animate({
						width: barperc
				}, dataperc * 25);
				if(!t.find('.label').children('div').length){
					t.find('.label').append('<div class="perc"></div>');
				}
			
				function perc() {
						var length = t.find('.bar').css('width'),
								perc = Math.round(parseInt(length) / 5.56),
								labelpos = (parseInt(length) - 2);
						t.find('.label').css('left', labelpos);
						// t.find('.perc').text(perc + '%');	
						t.find('.perc').text("Loading...");
				}
				perc();
				setInterval(perc, 0);
			});
		}
		
    function createLoader(opt) { // ww- 加载obj loader
		
		console.log($("#mask").css("display"))
		
			itemLoading ++;
			console.log(itemLoading);
        var onProgress = function (xhr) { // ww- 根据加载的过程去调用进度条函数
            console.log(xhr)
            if (xhr.lengthComputable) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				console.log(Math.round(percentComplete, 2) + '% downloaded')
				progress(Math.round(percentComplete, 2));
				if(Math.round(percentComplete, 2) == 100){
					itemLoading --;
					if(itemLoading <= 0){
						itemLoading = 0;
						$("#mask").css("display", "none")
						return 
					}
					
				}
            }
        };
				
        var onError = function (xhr) {
            console.log(xhr.readyState);
        };
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setBaseUrl("obj/5/");
        mtlLoader.setPath("obj/5/");
        mtlLoader.load(opt.name1, function (materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath("obj/5/");
            objLoader.load(opt.name2, function (obj) {
                obj.position.set(opt.x, opt.y, opt.z);
                obj.scale.set(opt.x1, opt.y1, opt.z1);
                obj.rotation.y = 0.08 * Math.PI;

                // dw-阴影效果
                var obj1 = obj;
                for (var k in obj.children) { //由于我们的素材并不是看上去的一个整体，所以需要进行迭代
                    //对其中的所有孩子都设置接收阴影以及投射阴影
                    //才能看到阴影效果
                    obj.children[k].castShadow = true; //设置该对象可以产生阴影
                    obj.children[k].receiveShadow = true; //设置该对象可以接收阴影
                }
                scene.add(obj1);

                if (obj.materialLibraries[0] == "room_0612.mtl") {
                    room_obj = obj;
                } else if (obj.materialLibraries[0] == "floor_0612.mtl") {
                    floor_obj = obj;
                } else if (obj.materialLibraries[0] == "0702.mtl") {
                    floor_opa_obj = obj;
                } else if (obj.materialLibraries[0] != "floor_0612.mtl") {
                    rooms.push(obj); // ww- 用来存放除了地板和园区模型之外的模型数据
                }
                scene.add(obj);
            }, onProgress, onError);

        });
    }

    function setControls() {
        // ww- controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 0, 0);
        // ww- 是否加阻尼惯性
        controls.enableDemping = true;

        controls.enableZoom = true;
        controls.minZoom = 0.01;
        controls.maxZoom = 10;
        // ww- controls.autoRotate=true;
        // ww- 相机最近和最远的地方
        controls.minDistance = 10;
        controls.maxDistance = 300;

        // ww- 控制旋转角度
        controls.minPolarAngle = 0.3; // ww- 模型翻转最小角度
        controls.maxPolarAngle = 1.4; // ww- 模型最大翻转角度

        // ww- 动态阻尼系数 就是鼠标拖拽旋转灵敏度
        controls.dampingFactor = 0.25;

        controls.enableKeys = true; // ww- 是否使用键盘控制
        controls.keyPanSpeed = 20;
        controls.keys = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            BOTTOM: 40
        };

        controls.addEventListener('change', render);
        controls.addEventListener('mousewheel', render);

        controls.autoRotate = false; // ww- 是否自动旋转
        controls.autoRotateSpeed = 2.0; // ww- 默认每秒30圈
    }

    function createSky() {
        var path = "../20180514/img/";
        var format = '.png';
        var urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];
        var textureCube = new THREE.CubeTextureLoader().load(urls);
        scene.background = textureCube;
    }
    //init 函数结束 ↑

    function render() {

    }

    function animate() {
        controls.update();
        render();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function draw() {
        init();
        animate();
        window.onresize = onWindowResize;
    }
