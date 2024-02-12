import Constants from 'expo-constants';
import { Platform } from 'react-native';
export default {

    registerMobileID(mobileID, expoPushToken){
        let formdata = new FormData();
        formdata.append("mobile_id", mobileID);
        formdata.append("token", expoPushToken);
        formdata.append("app_version", Platform.OS + " " + Platform.Version + " @ " + Constants.expoConfig.version);
        fetch('https://account.socialboom.hu/registermobile/61a557fc3b015d4a74899fdf2845290061a0b1903099a8981c305f274ff20dda',{
            method: 'post',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formdata
            }).then(response => {
                console.log("Socailboom Server Response: " + response.status)
            }).catch(err => {
                console.log(err)
            });
    }

}