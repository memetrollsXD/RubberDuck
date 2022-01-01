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

language.value = localStorage.getItem('language');
start.onclick = function () {
    if (topic.value.length > 0) {
        localStorage.setItem('language', language.value);
        if (!firebase.auth().currentUser) {
            firebase.auth().signInAnonymously().then(function () {
                console.log("Signed in");
                // Create a firestore document
                firebase.firestore().collection('messages').doc(firebase.auth().currentUser.uid).set({
                    assignee: 'undefined',
                    created: Date.now(),
                    language: language.value || "???",
                    topic: topic.value || "???",
                    messages: [
                        {
                            content: 'Topic was created',
                            sentBy: 'INFO',
                            timestamp: Date.now()
                        }
                    ]
                }).then(function () {
                    console.log('Document successfully written!');
                    window.location.href = 'app/';
                }).catch(function (error) {
                    console.error('Error writing document: ', error);
                });
            }).catch(function (error) {
                console.error(error.code, error.message);
            });
        } else {
            firebase.firestore().collection('messages').doc(firebase.auth().currentUser.uid).set({
                assignee: 'undefined',
                created: Date.now(),
                language: language.value || "???",
                topic: topic.value || "???",
                messages: [
                    {
                        content: 'Topic was created',
                        sentBy: 'INFO',
                        timestamp: Date.now()
                    }
                ]
            }).then(function () {
                console.log('Document successfully written!');
                window.location.href = 'app/';
            }).catch(function (error) { console.error('Error writing document: ', error); });
        }
    } else {
        alert('Please enter a topic');
    }
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        firebase.firestore().collection('messages').doc(firebase.auth().currentUser.uid).get().then(function (doc) {
            if (doc.exists) window.location.href = 'app/';
        });
    }
});