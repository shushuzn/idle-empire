// Idle Empire - 粒子背景效果 (优化版 v5.0)
// 性能优化：空间哈希、对象池、批量绘制、LOD、自适应帧率、可见性裁剪

(function() {
    var canvas, ctx, particles = [];
    var particleCount = 80;
    var colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFE066', '#FFF0B3', '#FFCC00', '#FFEC8B', '#FFF8DC', '#FFFAF0', '#FFDAB9', '#F5DEB3', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    var initialized = false;
    var time = 0;
    var animationId = null;
    
    // 帧率自适应
    var frameCount = 0;
    var lastFpsCheck = 0;
    var currentFps = 60;
    var autoQualityDown = false;
    var frameSkipCounter = 0;
    var skipFrames = 0; // 每N帧跳过绘制
    
    // 空间哈希网格
    var gridSize = 150;
    var grid = {};
    
    // 对象池 - 避免频繁创建/销毁对象
    var trailPool = [];
    var supernovaPool = [];
    var cometPool = [];
    
    // 预计算静态渐变
    var staticGradients = {};
    
    // 绘制批处理
    var connectionBatch = [];
    
    // 质量等级配置
    var QUALITY_LEVELS = {
        low: { 
            particles: 25, connectionDistance: 60, meteorChance: 0.002, glowLayers: 1, starDensity: 0.2, 
            trails: false, aurora: false, particles: false, connections: true, blackhole: false, comet: false,
            supernova: false, nebula: false, lensflare: false, planets: false, wormhole: false,
            _priority: 0, skipFrames: 3
        },
        medium: { 
            particles: 40, connectionDistance: 90, meteorChance: 0.004, glowLayers: 2, starDensity: 0.35, 
            trails: false, aurora: false, particles: true, connections: true, blackhole: false, comet: false,
            supernova: false, nebula: false, lensflare: false, planets: false, wormhole: false,
            _priority: 1, skipFrames: 2
        },
        high: { 
            particles: 60, connectionDistance: 120, meteorChance: 0.007, glowLayers: 3, starDensity: 0.5, 
            trails: true, aurora: false, particles: true, connections: true, blackhole: true, comet: true,
            supernova: true, nebula: true, lensflare: false, planets: true, wormhole: false,
            _priority: 2, skipFrames: 0
        },
        ultra: { 
            particles: 100, connectionDistance: 150, meteorChance: 0.012, glowLayers: 4, starDensity: 0.7, 
            trails: true, aurora: true, particles: true, connections: true, blackhole: true, comet: true,
            supernova: true, nebula: true, lensflare: true, planets: true, wormhole: true,
            _priority: 3, skipFrames: 0
        }
    };
    
    // 当前设置
    var currentQuality = 'high';
    var particlesEnabled = true;
    var scanlinesEnabled = true;
    var glowEnabled = true;
    var starsEnabled = true;
    
    // 背景星星
    var stars = [];
    var starCount = 400;
    
    // 粒子簇
    var clusters = [];
    var clusterCount = 6;
    
    // 黑洞
    var blackhole = { x: 0, y: 0, radius: 80, rotation: 0 };
    
    // 彗星
    var comets = [];
    var maxComets = 4;
    
    // 超新星
    var supernovas = [];
    var maxSupernovas = 2;
    
    // 星云
    var nebulaClouds = [];
    
    // 行星
    var planets = [];
    
    // 虫洞
    var wormholes = [];
    
    var auroraPhase = 0;
    
    // 视口边界
    var viewport = { x: 0, y: 0, width: 0, height: 0 };
    
    // ========== 对象池 ==========
    
    function getFromPool(pool) {
        return pool.length > 0 ? pool.pop() : null;
    }
    
    function returnToPool(pool, obj) {
        if (pool.length < 50) pool.push(obj);
    }
    
    // ========== 空间哈希网格 ==========
    
    function getGridKey(x, y) {
        return (Math.floor(x / gridSize) | 0) + ',' + (Math.floor(y / gridSize) | 0);
    }
    
    function buildGrid() {
        grid = {};
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var key = getGridKey(p.x, p.y);
            if (!grid[key]) grid[key] = [];
            grid[key].push(i);
        }
    }
    
    function getNeighborIndices(x, y) {
        var gx = Math.floor(x / gridSize);
        var gy = Math.floor(y / gridSize);
        var result = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var key = (gx + dx) + ',' + (gy + dy);
                if (grid[key]) {
                    var cell = grid[key];
                    for (var i = 0; i < cell.length; i++) {
                        result.push(cell[i]);
                    }
                }
            }
        }
        return result;
    }
    
    // ========== 可见性裁剪 ==========
    
    function isInViewport(x, y, margin) {
        margin = margin || 50;
        return x >= -margin && x <= viewport.width + margin &&
               y >= -margin && y <= viewport.height + margin;
    }
    
    function updateViewport() {
        viewport.width = canvas.width;
        viewport.height = canvas.height;
    }
    
    // ========== 初始化 ==========
    
    function init() {
        if (initialized) return;
        if (!document.getElementById('particles-container')) return;
        initialized = true;
        
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.95;';
        document.body.insertBefore(canvas, document.body.firstChild);
        
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        
        for (var i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }
        
        for (var i = 0; i < starCount; i++) {
            stars.push(createStar());
        }
        
        for (var i = 0; i < clusterCount; i++) {
            clusters.push(createCluster());
        }
        
        for (var i = 0; i < 3; i++) {
            nebulaClouds.push(createNebulaCloud(i));
        }
        
        planets.push(createPlanet(0.3, 0.7, 25, '#4ECDC4'));
        planets.push(createPlanet(0.75, 0.4, 18, '#FF6B6B'));
        
        wormholes.push(createWormhole(0.2, 0.3));
        wormholes.push(createWormhole(0.8, 0.7));
        
        updateViewport();
        buildGrid();
        animate();
    }
    
    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        blackhole.x = canvas.width * 0.85;
        blackhole.y = canvas.height * 0.15;
        updateViewport();
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1.5,
            baseSize: Math.random() * 3 + 1.5,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.4 + 0.6,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.012 + 0.006,
            twinklePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            trail: [],
            maxTrail: 10,
            shimmerPhase: Math.random() * Math.PI * 2
        };
    }
    
    function createStar() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.3,
            twinkleSpeed: Math.random() * 0.025 + 0.008,
            twinklePhase: Math.random() * Math.PI * 2,
            color: ['#FFD700', '#FFFFFF', '#FFFACD', '#F0E68C', '#87CEEB'][Math.floor(Math.random() * 5)]
        };
    }
    
    function createCluster() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 80 + 40,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }
    
    function createComet() {
        return {
            x: Math.random() * canvas.width * 0.5,
            y: Math.random() * canvas.height * 0.3,
            speedX: Math.random() * 4 + 2,
            speedY: Math.random() * 3 + 1,
            size: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            trail: []
        };
    }
    
    function createSupernova() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5,
            phase: 0,
            maxPhase: 120,
            size: Math.random() * 30 + 20,
            color: ['#FF6B6B', '#FFD700', '#FF4500'][Math.floor(Math.random() * 3)]
        };
    }
    
    function createNebulaCloud(index) {
        return {
            x: canvas.width * (0.2 + index * 0.3),
            y: canvas.height * (0.3 + index * 0.2),
            radius: 150 + index * 30,
            rotation: index * 0.5,
            rotationSpeed: 0.002 + index * 0.001,
            colors: [
                ['rgba(255,100,150,0.03)', 'rgba(150,50,200,0.02)'],
                ['rgba(100,150,255,0.03)', 'rgba(50,200,200,0.02)'],
                ['rgba(255,200,100,0.03)', 'rgba(200,100,50,0.02)']
            ][index]
        };
    }
    
    function createPlanet(xRatio, yRatio, size, color) {
        return {
            x: canvas.width * xRatio,
            y: canvas.height * yRatio,
            size: size,
            color: color,
            rotation: 0,
            hasRing: Math.random() > 0.5,
            ringColor: 'rgba(255,255,255,0.2)'
        };
    }
    
    function createWormhole(xRatio, yRatio) {
        return {
            x: canvas.width * xRatio,
            y: canvas.height * yRatio,
            radius: 40,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            particles: []
        };
    }
    
    function adjustParticleCount(targetCount) {
        var currentCount = particles.length;
        if (targetCount > currentCount) {
            for (var i = currentCount; i < targetCount; i++) {
                particles.push(createParticle());
            }
        } else if (targetCount < currentCount) {
            particles.length = targetCount;
        }
        particleCount = targetCount;
        buildGrid();
    }
    
    // ========== 绘制函数 ==========
    
    function drawBackgroundStars() {
        if (!starsEnabled) return;
        var settings = QUALITY_LEVELS[currentQuality];
        var visibleStars = Math.floor(starCount * settings.starDensity);
        
        ctx.save();
        for (var i = 0; i < visibleStars; i++) {
            var star = stars[i];
            star.twinklePhase += star.twinkleSpeed;
            var twinkle = Math.sin(star.twinklePhase) * 0.4 + 0.6;
            
            if (settings.glowLayers >= 2 && isInViewport(star.x, star.y, 20)) {
                ctx.globalAlpha = twinkle * 0.2;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.fill();
            }
            
            ctx.globalAlpha = twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();
        }
        ctx.restore();
    }
    
    function drawNebula() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.nebula) return;
        
        for (var n = 0; n < nebulaClouds.length; n++) {
            var cloud = nebulaClouds[n];
            cloud.rotation += cloud.rotationSpeed;
            
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.rotate(cloud.rotation);
            
            for (var c = 0; c < 2; c++) {
                var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radius * (0.8 + c * 0.4));
                gradient.addColorStop(0, cloud.colors[c]);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(0, 0, cloud.radius * (0.8 + c * 0.4), 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    function drawPlanets() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.planets) return;
        
        for (var p = 0; p < planets.length; p++) {
            var planet = planets[p];
            planet.rotation += 0.005;
            
            // 行星本体
            var planetGlow = ctx.createRadialGradient(
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, 0,
                planet.x, planet.y, planet.size
            );
            planetGlow.addColorStop(0, planet.color);
            planetGlow.addColorStop(0.7, planet.color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
            planetGlow.addColorStop(1, 'rgba(0,0,0,0.8)');
            
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            ctx.fillStyle = planetGlow;
            ctx.fill();
            
            // 光照效果
            var light = ctx.createRadialGradient(
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, 0,
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, planet.size * 0.5
            );
            light.addColorStop(0, 'rgba(255,255,255,0.4)');
            light.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, planet.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = light;
            ctx.fill();
            
            // 行星环
            if (planet.hasRing) {
                ctx.save();
                ctx.translate(planet.x, planet.y);
                ctx.rotate(planet.rotation * 0.3);
                ctx.scale(1, 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, planet.size * 1.8, 0, Math.PI * 2);
                ctx.strokeStyle = planet.ringColor;
                ctx.lineWidth = planet.size * 0.15;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
    
    function drawWormholes() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.wormhole) return;
        
        for (var w = 0; w < wormholes.length; w++) {
            var wormhole = wormholes[w];
            wormhole.rotation += 0.03;
            wormhole.pulsePhase += 0.05;
            
            var pulse = Math.sin(wormhole.pulsePhase) * 0.3 + 0.7;
            var radius = wormhole.radius * pulse;
            
            // 外层螺旋
            ctx.save();
            ctx.translate(wormhole.x, wormhole.y);
            for (var s = 0; s < 4; s++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(-radius * 2, 0);
                ctx.quadraticCurveTo(0, radius * 0.5, radius * 2, 0);
                ctx.strokeStyle = 'rgba(100,50,200,0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
            
            // 中心漩涡
            var centerGradient = ctx.createRadialGradient(wormhole.x, wormhole.y, 0, wormhole.x, wormhole.y, radius);
            centerGradient.addColorStop(0, 'rgba(0,0,0,0.9)');
            centerGradient.addColorStop(0.5, 'rgba(100,50,200,0.4)');
            centerGradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(wormhole.x, wormhole.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = centerGradient;
            ctx.fill();
        }
    }
    
    function drawBlackhole() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.blackhole) return;
        
        blackhole.rotation += 0.01;
        
        // 引力场
        var fieldGradient = ctx.createRadialGradient(
            blackhole.x, blackhole.y, 0,
            blackhole.x, blackhole.y, blackhole.radius * 3
        );
        fieldGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        fieldGradient.addColorStop(0.3, 'rgba(60, 0, 80, 0.3)');
        fieldGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(blackhole.x, blackhole.y, blackhole.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = fieldGradient;
        ctx.fill();
        
        // 事件视界
        var coreGradient = ctx.createRadialGradient(
            blackhole.x, blackhole.y, 0,
            blackhole.x, blackhole.y, blackhole.radius
        );
        coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        coreGradient.addColorStop(1, 'rgba(60, 0, 80, 0.5)');
        
        ctx.beginPath();
        ctx.arc(blackhole.x, blackhole.y, blackhole.radius, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // 吸积盘
        ctx.save();
        ctx.translate(blackhole.x, blackhole.y);
        ctx.rotate(blackhole.rotation);
        
        var diskColors = ['rgba(255,150,50,0.2)', 'rgba(255,100,100,0.16)', 'rgba(255,200,100,0.12)', 'rgba(200,100,255,0.08)'];
        for (var r = 0; r < 4; r++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, blackhole.radius * (1.4 + r * 0.25) * 1.6, blackhole.radius * (1.4 + r * 0.25) * 0.35, 0, 0, Math.PI * 2);
            ctx.strokeStyle = diskColors[r];
            ctx.lineWidth = 3 - r * 0.5;
            ctx.stroke();
        }
        ctx.restore();
        
        // 引力透镜优化：平方距离比较
        var bhRadiusSq = blackhole.radius * 4;
        bhRadiusSq *= bhRadiusSq;
        var innerRadiusSq = blackhole.radius;
        innerRadiusSq *= innerRadiusSq;
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var dx = blackhole.x - p.x;
            var dy = blackhole.y - p.y;
            var distSq = dx * dx + dy * dy;
            
            if (distSq < bhRadiusSq && distSq > innerRadiusSq) {
                var dist = Math.sqrt(distSq);
                var force = (blackhole.radius * 2) / dist;
                p.speedX += dx / dist * force * 0.015;
                p.speedY += dy / dist * force * 0.015;
            }
        }
    }
    
    function drawSupernovas() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.supernova) return;
        
        if (supernovas.length < maxSupernovas && Math.random() < 0.002) {
            supernovas.push(createSupernova());
        }
        
        // 从后往前遍历
        for (var i = supernovas.length - 1; i >= 0; i--) {
            var sup = supernovas[i];
            sup.phase++;
            
            var progress = sup.phase / sup.maxPhase;
            var alpha = progress < 0.1 ? progress * 10 : (1 - (progress - 0.1) / 0.9);
            var size = sup.size * (1 + progress * 3);
            
            // 爆发光环
            var burstGradient = ctx.createRadialGradient(sup.x, sup.y, 0, sup.x, sup.y, size * 2);
            burstGradient.addColorStop(0, sup.color);
            burstGradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
            burstGradient.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(sup.x, sup.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = burstGradient;
            ctx.fill();
            
            // 核心
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sup.x, sup.y, size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // 射线批量绘制
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            var rayAngle = sup.phase * 0.1;
            var rayLength = size * (1 + progress);
            for (var r = 0; r < 8; r++) {
                var angle = (r / 8) * Math.PI * 2 + rayAngle;
                ctx.moveTo(sup.x, sup.y);
                ctx.lineTo(sup.x + Math.cos(angle) * rayLength, sup.y + Math.sin(angle) * rayLength);
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            
            if (sup.phase >= sup.maxPhase) {
                supernovas.splice(i, 1);
            }
        }
    }
    
    function drawComets() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.comet) return;
        
        if (comets.length < maxComets && Math.random() < 0.006) {
            comets.push(createComet());
        }
        
        for (var i = comets.length - 1; i >= 0; i--) {
            var comet = comets[i];
            
            comet.x += comet.speedX;
            comet.y += comet.speedY;
            
            comet.trail.push({ x: comet.x, y: comet.y });
            if (comet.trail.length > 25) comet.trail.shift();
            
            // 尾迹
            var trailLen = comet.trail.length;
            for (var t = 0; t < trailLen; t++) {
                var tp = comet.trail[t];
                var trailAlpha = (t / trailLen) * 0.7;
                var trailSize = comet.size * (t / trailLen) * 0.9;
                
                ctx.globalAlpha = trailAlpha;
                ctx.beginPath();
                ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2);
                ctx.fillStyle = comet.color;
                ctx.fill();
            }
            
            // 头部光晕
            var headGlow = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, comet.size * 5);
            headGlow.addColorStop(0, '#FFFFFF');
            headGlow.addColorStop(0.2, comet.color);
            headGlow.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, comet.size * 5, 0, Math.PI * 2);
            ctx.fillStyle = headGlow;
            ctx.fill();
            
            // 核心
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            if (comet.x > canvas.width + 150 || comet.y > canvas.height + 150) {
                comets.splice(i, 1);
            }
        }
    }
    
    function drawLensflare() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.lensflare) return;
        
        var sunX = canvas.width * 0.15;
        var sunY = canvas.height * 0.12;
        
        var sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGlow.addColorStop(0, 'rgba(255,255,255,1)');
        sunGlow.addColorStop(0.5, 'rgba(255,200,100,0.3)');
        sunGlow.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fillStyle = sunGlow;
        ctx.fill();
    }
    
    function drawAmbientGlow() {
        if (!glowEnabled) return;
        
        var g1 = ctx.createRadialGradient(
            canvas.width * 0.1, canvas.height * 0.1, 0,
            canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.5
        );
        g1.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
        g1.addColorStop(1, 'transparent');
        
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawParticles() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.particles) return;
        
        ctx.save();
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            
            if (p.x < 0) p.x = canvas.width;
            else if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            else if (p.y > canvas.height) p.y = 0;
            
            p.pulsePhase += p.pulseSpeed;
            p.twinklePhase += 0.03;
            p.shimmerPhase += 0.02;
            
            var pulse = Math.sin(p.pulsePhase) * 0.25 + 0.75;
            var twinkle = Math.sin(p.twinklePhase) * 0.2 + 0.8;
            var shimmer = Math.sin(p.shimmerPhase) * 0.1 + 0.9;
            
            p.size = p.baseSize * pulse;
            var finalAlpha = p.alpha * pulse * twinkle * shimmer;
            
            // 拖尾
            if (settings.trails) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > p.maxTrail) p.trail.shift();
                
                var trailLen = p.trail.length;
                for (var t = 0; t < trailLen; t++) {
                    var tp = p.trail[t];
                    ctx.globalAlpha = (t / trailLen) * 0.3 * p.alpha;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, p.size * (t / trailLen) * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            }
            
            // 光晕
            if (glowEnabled && settings.glowLayers > 0) {
                ctx.globalAlpha = finalAlpha * 0.15;
                var glowSize = p.size * (9 - settings.glowLayers);
                var glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                glowGradient.addColorStop(0, p.color);
                glowGradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();
            }
            
            // 核心
            ctx.globalAlpha = finalAlpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // 高光
            ctx.globalAlpha = finalAlpha * 0.8;
            ctx.beginPath();
            ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    // ========== 空间哈希连接线 ==========
    
    function drawConnections() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.connections) return;
        
        var maxDist = settings.connectionDistance;
        var maxDistSq = maxDist * maxDist;
        
        buildGrid();
        ctx.save();
        ctx.lineWidth = 1;
        
        for (var i = 0; i < particles.length; i++) {
            var p1 = particles[i];
            var neighbors = getNeighborIndices(p1.x, p1.y);
            
            for (var j = 0; j < neighbors.length; j++) {
                var idx = neighbors[j];
                if (idx <= i) continue;
                
                var p2 = particles[idx];
                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                var distSq = dx * dx + dy * dy;
                
                if (distSq < maxDistSq) {
                    var alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.3;
                    
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    function drawMeteors() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!glowEnabled || settings.meteorChance === 0) return;
        
        if (Math.random() < settings.meteorChance) {
            var startX = Math.random() * canvas.width;
            var startY = Math.random() * canvas.height * 0.2;
            var length = Math.random() * 120 + 60;
            var angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
            
            var gradient = ctx.createLinearGradient(
                startX, startY,
                startX - length * Math.cos(angle), startY + length * Math.sin(angle)
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - length * Math.cos(angle), startY + length * Math.sin(angle));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.95;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    function drawAurora() {
        var settings = QUALITY_LEVELS[currentQuality];
        if (!settings.aurora) return;
        
        auroraPhase += 0.003;
        
        var baseY = canvas.height * 0.2;
        var auroraColors = ['rgba(0, 255, 150, 0.03)', 'rgba(50, 200, 255, 0.025)', 'rgba(150, 100, 255, 0.02)'];
        
        for (var i = 0; i < 3; i++) {
            var waveOffset = Math.sin(auroraPhase + i * 0.5) * 50;
            
            ctx.beginPath();
            ctx.moveTo(0, baseY + waveOffset);
            
            for (var x = 0; x <= canvas.width; x += 20) {
                var wx = x / canvas.width;
                var wy = Math.sin(wx * 6 + auroraPhase + i) * 35;
                ctx.lineTo(x, baseY + waveOffset + wy);
            }
            
            ctx.lineTo(canvas.width, canvas.height * 0.4);
            ctx.lineTo(0, canvas.height * 0.4);
            ctx.closePath();
            
            ctx.fillStyle = auroraColors[i];
            ctx.fill();
        }
    }
    
    // ========== 帧率自适应 ==========
    
    function checkPerformance() {
        frameCount++;
        var now = Date.now();
        
        if (now - lastFpsCheck >= 1000) {
            currentFps = frameCount;
            frameCount = 0;
            lastFpsCheck = now;
            
            var settings = QUALITY_LEVELS[currentQuality];
            skipFrames = settings.skipFrames || 0;
            
            if (currentFps < 30 && !autoQualityDown) {
                autoQualityDown = true;
                var levels = ['low', 'medium', 'high', 'ultra'];
                var idx = levels.indexOf(currentQuality);
                if (idx > 0) {
                    setGraphicsQuality(levels[idx - 1]);
                }
            }
            
            if (currentFps > 55 && autoQualityDown) {
                autoQualityDown = false;
            }
        }
    }
    
    // ========== 主循环 ==========
    
    function animate() {
        if (!ctx) return;
        
        // 帧率自适应跳过
        frameSkipCounter++;
        if (frameSkipCounter <= skipFrames) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        frameSkipCounter = 0;
        
        time += 0.016;
        checkPerformance();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackgroundStars();
        drawNebula();
        drawPlanets();
        
        if (glowEnabled) {
            drawAmbientGlow();
        }
        
        if (particlesEnabled) {
            drawParticles();
            drawConnections();
        }
        
        drawBlackhole();
        drawWormholes();
        drawSupernovas();
        drawComets();
        drawLensflare();
        drawMeteors();
        drawAurora();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // ========== API ==========
    
    window.setGraphicsQuality = function(level) {
        if (!QUALITY_LEVELS[level]) level = 'high';
        currentQuality = level;
        var settings = QUALITY_LEVELS[level];
        adjustParticleCount(settings.particles);
        skipFrames = settings.skipFrames || 0;
        localStorage.setItem('idle_empire_quality', level);
    };
    
    window.toggleParticles = function(enabled) {
        particlesEnabled = !!enabled;
        localStorage.setItem('idle_empire_particles', particlesEnabled);
    };
    
    window.toggleScanlines = function(enabled) {
        scanlinesEnabled = !!enabled;
        var scanline = document.querySelector('.scan-line');
        if (scanline) scanline.style.display = scanlinesEnabled ? 'block' : 'none';
        localStorage.setItem('idle_empire_scanlines', scanlinesEnabled);
    };
    
    window.toggleGlow = function(enabled) {
        glowEnabled = !!enabled;
        localStorage.setItem('idle_empire_glow', glowEnabled);
    };
    
    window.toggleStars = function(enabled) {
        starsEnabled = !!enabled;
        localStorage.setItem('idle_empire_stars', starsEnabled);
    };
    
    function loadSettings() {
        var saved = localStorage.getItem('idle_empire_quality');
        if (saved && QUALITY_LEVELS[saved]) {
            setGraphicsQuality(saved);
            var select = document.getElementById('setting-quality');
            if (select) select.value = saved;
        }
        
        ['particles', 'scanlines', 'glow', 'stars'].forEach(function(key) {
            var val = localStorage.getItem('idle_empire_' + key);
            if (val !== null) {
                var fn = key === 'particles' ? toggleParticles : 
                         key === 'scanlines' ? toggleScanlines :
                         key === 'glow' ? toggleGlow : toggleStars;
                fn(val === 'true');
                var el = document.getElementById('setting-' + key);
                if (el) el.checked = val === 'true';
            }
        });
    }
    
    window.initParticles = function() {
        init();
        setTimeout(loadSettings, 100);
    };
    
    window.getParticlePerformance = function() {
        return {
            fps: currentFps,
            particleCount: particles.length,
            quality: currentQuality,
            skipFrames: skipFrames,
            autoDowngraded: autoQualityDown
        };
    };
})();
