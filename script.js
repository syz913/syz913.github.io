window.onload = function() {
    //随机切换背景图片
    var images = ['img/bg.jpg', 'img/bg_2.png', 'img/bg_3.png'];
    var curIndex = 0;
    var timeInterval = 3000; //每秒钟切换一张
    setInterval(changeImg, timeInterval);

    function changeImg() {
        curIndex = (curIndex + 1) % images.length;
        // 修复切换背景图时出现的“白色闪屏”现象
        let img = new Image();
        img.src = images[curIndex];
        // 确定图片加载完成后再进行背景图片切换
        img.onload = function() {
            document.body.style.background = "url(" + img.src + ") no-repeat center center fixed"; //显示对应的图片
        }
    }
    //展示音频可视化
    const canvas = document.getElementById("canvas");
    const canvasCtx = canvas.getContext("2d");
    const audio = document.getElementById("audio");
    //首先实例化AudioContext对象 很遗憾浏览器不兼容，只能用兼容性写法；audioContext用于音频处理的接口，并且工作原理是将AudioContext创建出来的各种节点(AudioNode)相互连接，音频数据流经这些节点并作出相应处理。
    //总结就一句话 AudioContext 是音频对象，就像 new Date()是一个时间对象一样
    var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    if (!AudioContext) {
        alert("您的浏览器不支持audio API，请更换浏览器（chrome、firefox）再尝试！")
    }
    var visualizer = []; //准备绘制的能量球
    var random = function(m, n) {
        return Math.round(Math.random() * (n - m) + m);　　 //返回m~n之间的随机数
    };
    for (var i = 0; i < 120; i++) {
        var x = random(0, canvas.width),
            y = random(0, canvas.height),
            color = "rgba(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ",0)";　　 //随机化颜色
        visualizer.push({
            x: x,
            y: y,
            dy: Math.random() + 0.1,
            　　　 //保证dy>0.1
            color: color,
            radius: 30　　 //能量球初始化半径
        });
    }
    // 总结一下接下来的步骤
    // 1 先获取音频文件（目前只支持单个上传）
    // 2 读取音频文件，读取后，获得二进制类型的音频文件
    // 3 对读取后的二进制文件进行解码
    $('#musicFile').change(function() {
        if (this.files.length == 0) return;
        var file = $('#musicFile')[0].files[0]; //通过input上传的音频文件
        console.log('FILES[0]: ', file);
        var fileName = file.name;
        handleFile(file, fileName.substring(0, fileName.length - 4));
    })

    function handleFile(file, name) {
        $('#title').text(name)
        audio.src = URL.createObjectURL(file);
        var fileReader = new FileReader(); //使用FileReader异步读取文件
        fileReader.readAsArrayBuffer(file); //开始读取音频文件
        fileReader.onload = function(e) { //读取文件完成的回调
            //e.target.result 即为读取的音频文件（此文件为二进制文件）
            //下面开始解码操作 解码需要一定时间，这个时间应该让用户感知到
            var count = 0;
            $('#tip').text('开始解码')
            var timer = setInterval(function() {
                count++;
                $('#tip').text('解码中,已用时' + count + '秒')
            }, 1000)
            //开始解码，解码成功后执行回调函数
            var audioContext = new AudioContext();
            audioContext.decodeAudioData(e.target.result, function(buffer) {
                clearInterval(timer)
                $('#tip').text('解码成功，用时共计:' + count + '秒')
                // 创建AudioBufferSourceNode 用于播放解码出来的buffer的节点
                var audioBufferSourceNode = audioContext.createBufferSource();
                // 创建AnalyserNode 用于分析音频频谱的节点
                var analyser = audioContext.createAnalyser();
                //fftSize (Fast Fourier Transform) 是快速傅里叶变换，一般情况下是固定值2048。具体作用是什么我也不太清除，但是经过研究，这个值可以决定音频频谱的密集程度。值大了，频谱就松散，值小就密集。
                analyser.fftSize = 8192;
                // 连接节点,audioContext.destination是音频要最终输出的目标，
                // 我们可以把它理解为声卡。所以所有节点中的最后一个节点应该再
                // 连接到audioContext.destination才能听到声音。
                // audioBufferSourceNode.connect(analyser);
                var src = audioContext.createMediaElementSource(audio);
                src.connect(analyser);
                analyser.connect(audioContext.destination);
                console.log(audioContext.destination)
                // 播放音频
                audioBufferSourceNode.buffer = buffer; //回调函数传入的参数
                audioBufferSourceNode.start(); //部分浏览器是noteOn()函数，用法相同
                //可视化 创建数据
                // var dataArray = new Uint8Array(analyser.fftSize);
                // analyser.getByteFrequencyData(dataArray)//将数据放入数组，用来进行频谱的可视化绘制
                // console.log(analyser.getByteFrequencyData)
                var bufferLength = analyser.frequencyBinCount;
                console.log(bufferLength);
                var dataArray = new Uint8Array(bufferLength);
                console.log(dataArray)
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                //从频谱图中取出120条，避免过多影响视感
                var step = Math.round(bufferLength / 120);

                function draw() {
                    analyser.getByteFrequencyData(dataArray);
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                    // canvasCtx.fillRect(0, 0, 500, 500);
                    // var barWidth = (500 / bufferLength) * 2.5;
                    var barHeight;
                    canvasCtx.beginPath();
                    const mid = Math.round(canvas.width * .5);
                    var randomColor = 'rgb(0, 204, 255)'; //随机颜色
                    for (var i = 0; i < 120; i++) {
                        barHeight = dataArray[step * i];
                        //随机数0-255   Math.floor(Math.random()*255)  
                        // 随机数  10*Math.random()
                        canvasCtx.fillColor = 'rgb(0, 204, 255)';
                        // 根据频率不同，绘制不同的颜色
                        if (dataArray[step * i] > 200) {
                            randomColor = 'rgb(0, 126, 255)';
                        } else if (dataArray[step * i] > 160 || dataArray[step * i] < 50) {
                            randomColor = 'rgb(135, 206, 250)';
                        } else {
                            randomColor = 'rgb(0, 204, 255)'
                        }
                        //每1s换一次颜色
                        // if (i % 10 == 0) randomColor = 'rgb(' + (barHeight - 150) + ',' + Math.floor(Math.random() * (20 - 160) + 255) + ',' + Math.floor(Math.random() * (20 - 160) + 255) + ')';
                        canvasCtx.fillStyle = randomColor;
                        //右边一半的频谱图
                        canvasCtx.fillRect(i * 3 + mid, 80, 2, -barHeight / 4 + 1);
                        //左边一半的频谱图
                        canvasCtx.fillRect(mid - (i - 1) * 3, 80, 2, -barHeight / 4 + 1);
                        canvasCtx.fill();
                        canvasCtx.fillRect(i * 3 + mid, 80, 2, barHeight / 4 + 1);
                        canvasCtx.fillRect(mid - (i - 1) * 3, 80, 2, barHeight / 4 + 1);
                    }
                    requestAnimationFrame(draw);
                };

                function draw2() {
                    analyser.getByteFrequencyData(dataArray);
                    //绘制能量球
                    for (var i = 0; i < 120; i++) {
                        var s = visualizer[i];
                        s.radius = Math.round(dataArray[step * i] / 256 * (window.width > window.height ? canvas.width / 25 : canvas.height / 18));　　 //控制能量球大小与画布大小的比例
                        var gradient = canvasCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);　　 //创建能量球的渐变样式
                        gradient.addColorStop(0, "#fff");
                        gradient.addColorStop(0.5, "#D2BEC0");
                        gradient.addColorStop(0.75, s.color.substring(0, s.color.lastIndexOf(",")) + ",0.4)");
                        gradient.addColorStop(1, s.color);
                        canvasCtx.fillStyle = gradient;
                        canvasCtx.beginPath();
                        canvasCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, false);　　 //画一个能量球
                        canvasCtx.fill();
                        s.y = s.y - 2 * s.dy;　　 //能量球向上移动
                        if (s.y <= 0) {　　 //到画布顶端的时候重置s.y，随机化s.x
                            s.y = canvas.height;　　
                            s.x = random(0, canvas.width);
                        }
                    }
                    requestAnimationFrame(draw2);
                }
                audio.play();
                draw();
                draw2();
            });
        }
    }
    var lyric = [];
    var lyricContainer = document.getElementById('show-lrc-content');
    $('#lyricFile').change(function() {
        if (this.files.length == 0) return;
        var file = $('#lyricFile')[0].files[0]; //通过input上传的歌词文件
        console.log('FILES[0]: ', file)
        if (!file.name.endsWith(".lrc")) {
            alert("请上传 lrc 格式的歌词！");
            return;
        }
        var reader = new FileReader();
        reader.onload = function() {
            if (reader.result) {
                //显示文件内容
                lyric = parseLyric(reader.result);
                console.log(lyric)
            }
        };
        reader.readAsText(file);
    })
    //监听ontimeupdate事件
    document.getElementById('audio').ontimeupdate = function(e) {
        if (this.ended) {
            // audio.play();
            randomPlay();
        }
        //遍历所有歌词，看哪句歌词的时间与当然时间吻合
        for (var i = 0, l = lyric.length; i < l; i++) {
            if (this.currentTime > lyric[i].time) {
                //显示到页面
                lyricContainer.textContent = lyric[i].content;
            };
        };
    }

    function parseLyric(text) {
        //按行分割歌词            
        let lyricArr = text.split('\n'); //console.log(lyricArr)
        let result = [];
        //新建一个数组存放最后结果      
        //遍历分割后的歌词数组，将格式化后的时间节点，歌词填充到result数组           
        for (i = 0; i < lyricArr.length; i++) {
            let playTimeArr = lyricArr[i].match(/\[\d{2}:\d{2}((\.|\:)\d{2,3})\]/g);
            //正则匹配播放时间               
            let lineLyric = "";
            if (lyricArr[i].split(playTimeArr).length > 0) {
                lineLyric = lyricArr[i].split(playTimeArr);
            }
            if (playTimeArr != null) {
                for (let j = 0; j < playTimeArr.length; j++) {
                    let time = playTimeArr[j].substring(1, playTimeArr[j].indexOf("]")).split(":"); //数组填充   
                    result.push({
                        time: (parseInt(time[0]) * 60 + parseFloat(time[1])).toFixed(4),
                        content: String(lineLyric).substr(1)
                    });
                }
            }
        }
        return result;
    }
    //随机播放一首歌
    var musicSrcs = [{
        src: './assets/daoxiang.mp3',
        name: '稻香—周杰伦'
    }, {
        src: './assets/sun.mp3',
        name: "太阳—萧敬腾"
    }, {
    	src: './assets/silence.mp3',
    	name: "静悄悄—大泫"
    }, {
    	src: './assets/memory.mp3',
    	name: "我怀念的—孙燕姿"
    }];
    var lyricSrcs = ['./assets/daoxiang.lrc', './assets/sun.lrc', './assets/silence.lrc', './assets/memory.lrc'];
    $('#randomPlay').click(function() {
        randomPlay();
    })

    function randomPlay(){
    	var index = Math.floor(Math.random() * 4);
        console.log(index)
        var source = musicSrcs[index]
        try {
            $.get(lyricSrcs[index], function(lrc) {
                lyric = parseLyric(lrc);
            });
        } catch (err) {
            alert(err)
        }
        console.log(index)
        var source = musicSrcs[index]
        $('#title').text(source.name)
        audio.src = source.src;
        audioContext = new AudioContext();
        var analyser = audioContext.createAnalyser();
        analyser.fftSize = 8192;
        var src = audioContext.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(audioContext.destination);
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        console.log(dataArray)
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        var step = Math.round(bufferLength / 120);

        function draw() {
            analyser.getByteFrequencyData(dataArray);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            var barHeight;
            canvasCtx.beginPath();
            const mid = Math.round(canvas.width * .5);
            var randomColor = 'rgb(0, 204, 255)'; //随机颜色
            for (var i = 0; i < 120; i++) {
                barHeight = dataArray[step * i];
                canvasCtx.fillColor = 'rgb(0, 204, 255)';
                if (dataArray[step * i] > 200) {
                    randomColor = 'rgb(0, 126, 255)';
                } else if (dataArray[step * i] > 160 || dataArray[step * i] < 50) {
                    randomColor = 'rgb(135, 206, 250)';
                } else {
                    randomColor = 'rgb(0, 204, 255)'
                }
                canvasCtx.fillStyle = randomColor;
                canvasCtx.fillRect(i * 3 + mid, 80, 2, -barHeight / 4 + 1);
                canvasCtx.fillRect(mid - (i - 1) * 3, 80, 2, -barHeight / 4 + 1);
                canvasCtx.fill();
                canvasCtx.fillRect(i * 3 + mid, 80, 2, barHeight / 4 + 1);
                canvasCtx.fillRect(mid - (i - 1) * 3, 80, 2, barHeight / 4 + 1);
            }
            requestAnimationFrame(draw);
        };

        function draw2() {
            analyser.getByteFrequencyData(dataArray);
            //绘制能量球
            for (var i = 0; i < 120; i++) {
                var s = visualizer[i];
                s.radius = Math.round(dataArray[step * i] / 256 * (window.width > window.height ? canvas.width / 25 : canvas.height / 18));　　 //控制能量球大小与画布大小的比例
                var gradient = canvasCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);　　 //创建能量球的渐变样式
                gradient.addColorStop(0, "#fff");
                gradient.addColorStop(0.5, "#D2BEC0");
                gradient.addColorStop(0.75, s.color.substring(0, s.color.lastIndexOf(",")) + ",0.4)");
                gradient.addColorStop(1, s.color);
                canvasCtx.fillStyle = gradient;
                canvasCtx.beginPath();
                canvasCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, false);　　 //画一个能量球
                canvasCtx.fill();
                s.y = s.y - 2 * s.dy;　　 //能量球向上移动
                if (s.y <= 0) {　　 //到画布顶端的时候重置s.y，随机化s.x
                    s.y = canvas.height;　　
                    s.x = random(0, canvas.width);
                }
            }
            requestAnimationFrame(draw2);
        }
        audio.play();
        draw();
        draw2();
    }
}