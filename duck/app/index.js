const firebaseConfig = {
    apiKey: "AIzaSyCGi5ghIhX3BgMuRuk0WFyEuEumvc5NnOc",
    authDomain: "rubberduck-59894.firebaseapp.com",
    projectId: "rubberduck-59894",
    storageBucket: "rubberduck-59894.appspot.com",
    messagingSenderId: "132596552855",
    appId: "1:132596552855:web:c39d601a23661f949645d2",
    measurementId: "G-R35M0M9ZJP"
};
firebase.initializeApp(firebaseConfig);
var displayName = undefined;
const chatContent = document.getElementById('chat-content');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendMessage');
const solvedBtn = document.getElementById('solvedBtn');
const unassignBtn = document.getElementById('unassignBtn');
let hasUnassigned = false;
let codeMode = false;
let notifsound = new Audio('../../notif.ogg');
notifsound.volume = 1;
const urlParams = new URLSearchParams(window.location.search);
String.prototype.lines = function () { return this.split(/\r*\n/); }
String.prototype.lineCount = function () { return this.lines().length; }
String.prototype.replaceLast = function (search, replace) { return this.replace(new RegExp(search + "([^" + search + "]*)$"), replace + "$1"); }
function antiSpam(string) {
    while (string.slice(-1) === ' ' || string.slice(-1) === '\n' || string.slice(-1) === '\t') string = string.slice(0, -1);
    return string;
}
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        displayName = user.displayName;
        firebase.firestore().collection("messages").doc(urlParams.get('topic')).onSnapshot((doc) => {
            const messages = doc.data().messages;
            chatContent.innerHTML = '';
            if (doc.data().assignee === 'undefined' && !hasUnassigned) {
                firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({ assignee: firebase.auth().currentUser.uid });
                sendSystemNotification("conv-join");
            }
            if (!doc.data().allowAssignee) unassignBtn.click();
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.codeMode === 'undefined') message.codeMode = false;
                const messageElement = document.createElement('div');
                switch (message.sentBy) {
                    case "LOCAL":
                        if (!document.hasFocus()) {
                            notifsound.play();
                            // notify.show(message.content, 'New message', '../../duck.png');
                        }
                        messageElement.innerHTML = `
                        <div class="media media-chat"> <img class="avatar smaller_duck" src="${generateAvatarByUID(doc.id)}" alt="...">
                            <div class="media-body" style="white-space: pre-wrap;">
                                <p>...</p>
                                <p class="meta"><time datetime="2018">${convertTimestamp(message.timestamp)}</time></p>
                            </div>
                        </div>
                        `;
                        message.codeMode ? messageElement.children[0].children[1].children[0].innerHTML = hljs.highlightAuto(message.content).value : messageElement.children[0].children[1].children[0].innerText = antiSpam(message.content);
                        if (message.codeMode) messageElement.children[0].children[1].children[0].style = "background-color: #1a1a1a;"
                        break;
                    case "REMOTE":
                        messageElement.innerHTML = `
                            <div class="media media-chat media-chat-reverse">
                            <div class="media-body" style="white-space: pre-wrap;">
                                <p>...</p>
                                <p class="meta"><time datetime="2018">${convertTimestamp(message.timestamp)}</time></p>
                            </div>
                            </div>
                        `;
                        message.codeMode ? messageElement.children[0].children[0].children[0].innerHTML = hljs.highlightAuto(message.content).value : messageElement.children[0].children[0].children[0].innerText = antiSpam(message.content);
                        if (message.codeMode) messageElement.children[0].children[0].children[0].style = "background-color: #1a1a1a;"
                        break;
                    case "SOLVED":
                        firebase.firestore().collection("messages").doc(firebase.auth().currentUser.uid).delete().then(() => {
                            // Redirect to the home page
                            window.location.href = '../';
                        }).catch((error) => { console.log(error); });
                        break;
                    case "INFO":
                        messageElement.innerHTML = `<div class="media media-meta-day">${convertTimestamp(message.timestamp)} — ${message.content}</div>`;
                        if (message.content.includes("marked as solved")) {
                            firebase.firestore().collection("messages").doc(user.uid).delete().then(() => {
                                // Redirect to the home page
                                window.location.href = '../';
                            }).catch((error) => { console.log(error); });
                        }
                        break;
                }
                if (i === messages.length - 1) {
                    messageElement.innerHTML += `<br><br>`
                }
                chatContent.appendChild(messageElement);
                chatContent.scrollTop = chatContent.scrollHeight;
            }
        }, (error) => { window.location.href = '../'; });
    } else {
        window.location.href = '../';
    }
});

function generateAvatarByUID(seed) {
    const avatar = `https://avatars.dicebear.com/api/identicon/${seed.toString()}.svg`;
    return avatar;
}

function convertTimestamp(timestamp) {
    const date = new Date(parseInt(timestamp));
    const hours = date.getHours();
    let minutes = date.getMinutes();
    if (minutes.toString().length === 1) minutes = `0${minutes}`;
    return `${hours}:${minutes}`;
}
function insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}
function sendMessage() {
    const message = messageInput.value;
    if (message.length > 0) {
        const timestamp = Date.now();
        firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({
            messages: firebase.firestore.FieldValue.arrayUnion({
                content: message,
                sentBy: "REMOTE",
                timestamp: timestamp,
                codeMode: codeMode
            })
        }).then(() => {
            messageInput.value = '';
            messageInput.style.height = '30px'; messageInput.scrollHeight = '30px';
            codeMode = false;
        }).catch((error) => {
            console.log(error);
        });
    }
}
function sendSystemNotification(type) {
    switch (type) {
        case "conv-join":
            firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    content: `A duck has been assigned to you`,
                    sentBy: "INFO",
                    timestamp: Date.now(),
                    codeMode: false
                })
            });
            break;
        case "conv-leave":
            firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    content: `The duck has left the conversation`,
                    sentBy: "INFO",
                    timestamp: Date.now(),
                    codeMode: false
                })
            });
            break;
        case "solve":
            firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    content: `Topic marked as solved`,
                    sentBy: "INFO",
                    timestamp: Date.now(),
                    codeMode: false
                })
            }).then(() => {
                firebase.firestore().collection("messages").doc(urlParams.get('topic')).delete();
            }).catch((error) => { console.log(error); });
            break;
        default:
            console.warn("Unknown notification type");
            break;
    }
}
sendButton.onclick = sendMessage();
messageInput.onkeydown = function (e) { // Keyup is too late, needs to be keydown
    if (e.shiftKey && e.key === 'Tab') {
        console.log(true, 'shift tab');
        e.preventDefault();
        if (codeMode) {
            if (messageInput.value.slice(-1) == "\t") messageInput.value = messageInput.value.replaceLast("\t", "")
        } else {
            messageInput.value = messageInput.value.replaceLast("\t", "");
        }
    }
    if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        document.activeElement.id === 'messageInput' ? insertAtCursor(messageInput, "\t") : messageInput.focus();
    }
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
}
messageInput.addEventListener('keyup', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!codeMode) sendMessage();
    }
    // If CTRL + / is pressed, switch to code mode
    if (event.key === '/' && event.ctrlKey) {
        event.preventDefault();
        document.getElementById('codeBtn').click();
    }
    // If messageInput is overflown, make it bigger
    // console.log((messageInput.scrollHeight > 30), messageInput.scrollHeight, messageInput.clientHeight);
    // if (messageInput.scrollHeight > 30) {
    //     messageInput.style.height = messageInput.scrollHeight + 'px';
    //     console.log("Supposed to resize")
    // } else {
    //     messageInput.style.height = '30px';
    // }
    if (messageInput.value.lineCount() == 1) {
        messageInput.style.height = '30px'; messageInput.scrollHeight = '30px';
    } else {
        messageInput.style.height = "auto";
        messageInput.style.height = messageInput.scrollHeight + "px";
    }
});

document.getElementById('codeBtn').onclick = () => {
    if (!codeMode) {
        codeMode = true;
        document.getElementById('codeBtn').children[0].style = "color: green;"
        messageInput.style.backgroundColor = "#1a1a1a";
    } else {
        codeMode = false;
        document.getElementById('codeBtn').children[0].style = "color: #cac7c7;"
        messageInput.style.backgroundColor = "transparent";
    }
    if (!localStorage.getItem('alreadyUsedCodeMode')) {
        alert("You've activated Code Mode!\n\nCode mode is a feature that allows you to send messages in code blocks.")
        localStorage.setItem('alreadyUsedCodeMode', 'true');
    }
}

solvedBtn.onclick = () => {
    sendSystemNotification("solve");
}
unassignBtn.onclick = () => {
    // Update 'assignee' to 'undefined'
    hasUnassigned = true;
    firebase.firestore().collection("messages").doc(urlParams.get('topic')).update({
        assignee: 'undefined'
    }).then(() => {
        sendSystemNotification('conv-leave');
        window.location.href = '../';
    }).catch((error) => { console.log(error); });
}

document.onkeydown = function (e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        messageInput.focus();
    }
}