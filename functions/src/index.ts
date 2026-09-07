import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

export const deleteUserProfile = functions.auth
  .user()
  .onDelete(async (user) => {
    await getFirestore()
      .collection("users")
      .doc(user.uid)
      .delete();

    console.log(`Deleted Firestore profile: ${user.uid}`);
  });
