(function() {
    'use strict';

    // Helper functions
    const on = addEventListener;
    const $ = (q) => document.querySelector(q);
    const $$ = (q) => document.querySelectorAll(q);
    const $body = document.body;
    const $main = $('#main');

    /**
     * Draggable window functionality
     * @param {HTMLElement} elmnt The element to make draggable
     */
    function dragElement(elmnt) {
        let currentX = 0, currentY = 0; // Current position of the element (pixels from top-left)
        let initialMouseX = 0, initialMouseY = 0; // Mouse position when drag starts

        const dragHandle = $('#windowButtons');

        // Initial centering of the element (only once)
        // This function will also be called on resize to keep the element centered.
        function centerElement() {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const elmntHeight = elmnt.offsetHeight;

            currentX = (viewportWidth - elmntWidth) / 2;
            currentY = (viewportHeight - elmntHeight) / 2;

            elmnt.style.left = currentX + "px";
            elmnt.style.top = currentY + "px";
        }

        // Call centerElement initially and on resize to keep it centered
        on('load', centerElement);
        on('resize', centerElement); // Re-center on window resize

        if (dragHandle) {
            dragHandle.onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Get the mouse cursor position at startup:
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            // Get the element's current position (relative to viewport)
            currentX = elmnt.offsetLeft;
            currentY = elmnt.offsetTop;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDragMove;
        }

        function elementDragMove(e) {
            e = e || window.event;
            e.preventDefault();

            // Calculate the new cursor position:
            let dx = e.clientX - initialMouseX; // Delta X
            let dy = e.clientY - initialMouseY; // Delta Y

            // Calculate the element's potential new position
            let newX = currentX + dx;
            let newY = currentY + dy;

            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Get element dimensions
            const elmntWidth = elmnt.offsetWidth;
            const elmntHeight = elmnt.offsetHeight;

            // Apply boundary checks
            // Left boundary
            if (newX < 0) {
                newX = 0;
            } else if (newX + elmntWidth > viewportWidth) {
                newX = viewportWidth - elmntWidth;
            }

            // Top boundary
            if (newY < 0) {
                newY = 0;
            } else if (newY + elmntHeight > viewportHeight) {
                newY = viewportHeight - elmntHeight;
            }

            // Update element's position
            elmnt.style.left = newX + "px";
            elmnt.style.top = newY + "px";

            // Update currentX, currentY for next drag move to ensure continuous dragging from new position
            currentX = newX;
            currentY = newY;
            initialMouseX = e.clientX; // Update initial mouse position for the next movement
            initialMouseY = e.clientY;
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    /**
     * Client/Browser information sniffing
     */
    const client = (function() {
        const o = {
            browser: 'other',
            browserVersion: 0,
            os: 'other',
            osVersion: 0,
            mobile: false,
            canUse: null
        };
        const ua = navigator.userAgent;
        let a, i;

        // Browser detection
        a = [
            ['firefox', /Firefox\/([0-9\.]+)/],
            ['edge', /Edge\/([0-9\.]+)/],
            ['safari', /Version\/([0-9\.]+).+Safari/],
            ['chrome', /Chrome\/([0-9\.]+)/],
            ['ie', /Trident\/.+rv:([0-9]+)/]
        ];
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.browser = a[i][0];
                o.browserVersion = parseFloat(RegExp.$1);
                break;
            }
        }

        // OS detection
        a = [
            ['ios', /([0-9_]+) like Mac OS X/, (v) => v.replace(/_/g, '.')],
            ['ios', /CPU iPhone OS ([0-9_]+)/, (v) => v.replace(/_/g, '.')],
            ['android', /Android ([0-9\.]+)/, null],
            ['mac', /Macintosh.+Mac OS X ([0-9_]+)/, (v) => v.replace(/_/g, '.')],
            ['windows', /Windows NT ([0-9\.]+)/, null],
        ];
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.os = a[i][0];
                o.osVersion = parseFloat(a[i][2] ? (a[i][2])(RegExp.$1) : RegExp.$1);
                break;
            }
        }

        // Mobile check
        o.mobile = (o.os === 'android' || o.os === 'ios');

        // Feature detection
        o.canUse = function(p) {
            const e = document.createElement('div');
            const prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
            for (const prefix of prefixes) {
                if ((prefix + p) in e.style) return true;
            }
            return false;
        };

        return o;
    }());

    /**
     * Page load animations
     */
    function play() {
        if ($body.classList.contains('is-playing')) return;

        $body.classList.remove('is-loading');

        const startPlaying = () => {
             $body.classList.add('is-playing');
             $main.classList.add('is-playing');
        };

        on('click', startPlaying, { once: true });
        on('touchstart', startPlaying, { once: true });
        on('keydown', startPlaying, { once: true });
    }

    /**
     * Apply browser/OS specific fixes
     */
    function applyHacks() {
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        const sheet = style.sheet;

        if (client.mobile) {
            // Use svh for viewport height if supported, otherwise use innerHeight fallback
            if (client.canUse('height', '100svh')) {
                document.documentElement.style.setProperty('--viewport-height', '100svh');
                document.documentElement.style.setProperty('--background-height', '100lvh');
            } else {
                const setHeight = () => {
                    document.documentElement.style.setProperty('--viewport-height', window.innerHeight + 'px');
                };
                on('load', setHeight);
                on('resize', setHeight);
                on('orientationchange', setHeight);
            }
            $body.classList.add('is-touch');
        }

        // iOS specific fixes
        if (client.os === 'ios' && client.osVersion <= 11) {
            // Fix for white bar on scroll
            sheet.insertRule('body::after { -webkit-transform: scale(1.0); }', 0);
            // Fix for form focus issues
            sheet.insertRule('body.ios-focus-fix::before { height: calc(100% + 60px); }', 0);
            on('focus', () => $body.classList.add('ios-focus-fix'), true);
            on('blur', () => $body.classList.remove('ios-focus-fix'), true);
        }
    }

    // --- Dynamic Age Counter ---
    // Ngày sinh của bạn (Ví dụ: 15 tháng 5 năm 2000)
    // Thay đổi ngày này thành ngày sinh của bạn để tính toán chính xác
    const birthDate = new Date('2011-03-30T02:00:00'); // Định dạngYYYY-MM-DDTHH:mm:ss

    function updateDynamicAge() {
        const now = new Date();
        const diffInMs = now.getTime() - birthDate.getTime();

        // Số milliseconds trong một năm trung bình (365.25 ngày/năm * 24 giờ/ngày * 60 phút/giờ * 60 giây/phút * 1000 ms/giây)
        const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
        const age = diffInMs / msPerYear;

        const ageElement = $('#dynamicAge');
        if (ageElement) {
            // Cập nhật số tuổi với 7 chữ số thập phân để giảm tốc độ thay đổi ở cuối
            ageElement.textContent = age.toFixed(7);
        }
    }

    // --- Current Date Time Counter ---
    function updateCurrentDateTime() {
        const now = new Date();
        const optionsDate = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        const optionsTime = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Định dạng 24 giờ
        };
        // Định dạng ngày (DD/MM/YYYY) và giờ (HH:mm:ss) riêng biệt rồi ghép lại
        const formattedDate = now.toLocaleDateString('vi-VN', optionsDate);
        const formattedTime = now.toLocaleTimeString('vi-VN', optionsTime);

        const dateTimeElement = $('#currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = `${formattedDate} ${formattedTime}`;
        }
    }

    // --- INITIALIZATION ---

    // Make window draggable
    dragElement($('#wrapper'));

    // Apply necessary CSS/JS hacks
    applyHacks();

    // Set up page load animation
    on('load', () => {
        setTimeout(() => play(), 100);
        // Bắt đầu cập nhật số tuổi động ngay sau khi trang tải
        updateDynamicAge(); // Cập nhật lần đầu tiên
        setInterval(updateDynamicAge, 50); // Vẫn cập nhật mỗi 50ms để tạo hiệu ứng chạy mượt mà

        // Bắt đầu cập nhật ngày giờ hiện tại mỗi giây
        updateCurrentDateTime(); // Cập nhật lần đầu tiên
        setInterval(updateCurrentDateTime, 1000); // Cập nhật mỗi giây
    });

})();
