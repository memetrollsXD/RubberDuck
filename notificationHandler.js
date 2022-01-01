// Thank you Ben @ bennish.net
// https://www.bennish.net/web-notifications.html
window.onload = function () {
    window.notify = {
        list: [],
        id: 0,
        isAuthorized: false,
        log: function (msg) {
            console.log(msg);
        },
        compatible: function () {
            if (typeof Notification === 'undefined') {
                notify.log("Notifications are not available for your browser.");
                return false;
            }
            return true;
        },
        authorize: function () {
            if (notify.compatible()) {
                Notification.requestPermission(function (permission) {
                    notify.log("Permission to display: " + permission);
                    notify.isAuthorized = true;
                    return permission;
                });
            }
        },
        show: function (body, title, icon) {
            if (typeof Notification === 'undefined') { notify.log("Notifications are not available for your browser."); return; }
            if (notify.isAuthorized) {
                notify.id++;
                var id = notify.id;
                notify.list[id] = new Notification(title, {
                    body: body,
                    tag: id,
                    lang: "",
                    dir: "auto",
                    icon: icon,
                    silent: true
                });
                setTimeout(() => {notify.list[id].close();}, 1500);
                notify.log("Notification #" + id + " queued for display");
                notify.list[id].onclick = notify.list[id].close();
                console.log("Created a new notification ...");
                console.log(notify.list[id]);
            }
            notify.authorize();
        },
        logEvent: function (id, event) {
            notify.log("Notification #" + id + " " + event);
        }
    };
};