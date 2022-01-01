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
const start = document.getElementById('start');
const topic = document.getElementById('topic');
const language = document.getElementById('language');
const loginForm = document.getElementById('loginForm');
const githubProvider = new firebase.auth.GithubAuthProvider();
let pingsound = new Audio('ping.mp3');
pingsound.volume = 1;

start.onclick = function () {
    // edit snapshot defined below to have your own uid as assignee
    firebase.firestore().collection('messages').doc(topic[topic.selectedIndex].id).update({
        assignee: firebase.auth().currentUser.uid
    });
    window.location.href = `app?topic=${topic[topic.selectedIndex].id}`;
}
function changeSignInMethod() {
    firebase.auth().signInWithPopup(githubProvider).then(function (result) {
        // This gives you a GitHub Access Token. You can use it to access the GitHub API.
        const token = result.credential.accessToken;
        const user = result.user;
        window.location.reload();
    });
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        if (user.isAnonymous == true) {
            console.log(user.isAnonymous);
            changeDisplay("switchAuth");
        } else {
            changeDisplay();
        }
    } else {
        changeDisplay("notLoggedIn");
    }
});

function changeDisplay(view = "default") {
    switch (view) {
        case "default":
            // get a snapshot of all documents in messages with 'assignee' as undefined
            firebase.firestore().collection('messages').where('assignee', 'in', ["undefined", firebase.auth().currentUser.uid]).onSnapshot((querySnapshot) => {
                topic.innerHTML = '<option value="default" default disabled>Select a topic</option>';
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    if (doc.data().allowAssignee) topic.innerHTML += `<option id="${doc.id}">${(doc.data().assignee == firebase.auth().currentUser.uid) ? '* ' : ''}${doc.data().language} — ${doc.data().topic}</option>`;
                });
                topic.value = "default";
            });
            break;
        case "switchAuth":
            loginForm.innerHTML = `
            <img src="../duck.svg" class="small_duck" /></object>
            <h5 id="email" class="emailText loggedInLinks">RubberDuck</h5><br>
            <h2>Signed in anonymously</h2>
            <p>You are currently signed in anonymously. But to volunteer as a duck, you need to sign in via GitHub</p>
            <button onclick="changeSignInMethod()" class="btn btn-primary">Sign in via GitHub</button>
            `;
            break;
        case "notLoggedIn":
            loginForm.innerHTML = `
            <img src="../duck.svg" class="small_duck" /></object>
            <h5 id="email" class="emailText loggedInLinks">RubberDuck</h5><br>
            <h2>Not signed in</h2>
            <p>You are not signed in. To volunteer as a duck, you need to sign in via GitHub</p>
            <button onclick="changeSignInMethod()" class="btn btn-primary">Sign in via GitHub</button>
            `;
            break;
    }
}