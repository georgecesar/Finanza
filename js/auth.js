export default class Auth {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  signUp() {
    firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(e => console.log(e)).catch(e => console.log(e));
  }

  signIn() {
    firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(e => console.log(e)).catch(e => console.log(e));
  }

  signOut() {
    firebase.auth().signOut.then(e => console.log('Signed out')).catch(e => console.log(e));
  }
}
