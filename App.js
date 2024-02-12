import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, NativeModules  } from 'react-native';
import { WebView  } from 'react-native-webview';
import { BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import Colors from './constants/colors';
import StorageHelper from './helper/StorageHelper';
import PushHelper from './helper/PushHelper';
import TokenHelper from './helper/TokenHelper';


// PUSH
Notifications.setNotificationHandler({ handleNotification: async () => ({shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true, }), });

export default function App() {

    const [expoPushToken, setExpoPushToken] = useState('');
    const [webKey, setWebKey] = useState(1);
    
    const [mobileID, setMobileID] = useState(null);
    const [mobileIdSetted, setMobileIdSetted] = useState(false);
    const [role, setRole] = useState(3);
    const [needLoadHome, setNeedLoadHome] = useState(true);
    const [savedCookies,setSavedCookies] = useState(null);
    const [webviewSource, setWebviewSource] = useState({ uri: 'https://account.socialboom.hu/',headers: {Cookie: savedCookies},  }); //,headers: {Cookie: savedCookies},
    const [errorState, setErrorState] = useState(false);
    const webViewRef = useRef(null);
    const [menu, setMenu] = useState(   [{url: 'https://account.socialboom.hu/', icon: 'home', name: 'Áttekintés'},
                                        {url: 'https://account.socialboom.hu/influencer/campaign/list/', icon: 'megaphone', name: 'Kampányok'},
                                        {url: 'https://account.socialboom.hu/influencer/application/list/', icon: 'star', name: 'Jelentkezések'}]);

    const lastNotificationResponse = Notifications.useLastNotificationResponse();

    // ########## -------- RUN ONCE -------- ##########

    useEffect(() => {
        // Push token beállítás
        PushHelper.registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        // Mentett adatok betöltése Storage-ból
        (async () => {
            try {
                //await StorageHelper.removeItem('mobileId'); 
                //await StorageHelper.removeItem('cookies'); 
                await StorageHelper.getItem('mobileId').then(value => { console.log("Mobile ID: " + value); setMobileID(value)});
                await StorageHelper.getItem('cookies').then(value => { console.log("Saved Cookies: " + value); setSavedCookies(value); });
            } catch(e) {}
          })();


        return () => {};
    }, []);



    // Mobil azonosító beállítása & szervernek küldés
    useEffect(() => {
        console.log(mobileID);
        if (mobileID == null || mobileID == "0"){
            setRole(3);
            return;
        } 
        //console.log("====== mobile id setted - send to server ======")
        vals = mobileID.split("_");
        setRole(vals[1]);

        // Send mobile token to SB server
        if (expoPushToken !== ''){
            //console.log("1. küldés, token: " + expoPushToken);
            TokenHelper.registerMobileID(mobileID, expoPushToken);
        } 
        
        return () => {};
    }, [mobileID]);

    // PushToken beállítva - küldés szervernek
    useEffect(() => {
        if (mobileID !== null) TokenHelper.registerMobileID(mobileID, expoPushToken);
        return () => {};
    }, [expoPushToken]);

    // Cookie betöltés után újratöltés
    useEffect(() => {
        console.log('Cookie betöltve Statebe: ' + savedCookies);
        if (needLoadHome){
            console.log('süti beállítva, loadhome');
            loadHome();
            setNeedLoadHome(false);
        } 
        return () => {};
    }, [savedCookies]);

    // Push kattintás kezelése
    useEffect(() => {
        if (lastNotificationResponse && lastNotificationResponse.notification.request.content.data.url && lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            setWebviewSource({ uri: lastNotificationResponse.notification.request.content.data.url,  }); setErrorState(false);
        }
      }, [lastNotificationResponse]);

    useEffect(() => {
        console.log("role változott: " + role);
        if (role == 0) {setMenu([
            {url: 'https://account.socialboom.hu/admin/influencers/', icon: 'people', name: 'Influencerek'}, // admin
            {url: 'https://account.socialboom.hu/admin/companies/', icon: 'business', name: 'Cégek'},
            {url: 'https://account.socialboom.hu/admin/campaigns/', icon: 'megaphone', name: 'Kampányok'}
        ]);}

        if (role == 1)  {setMenu([
            {url: 'https://account.socialboom.hu/', icon: 'home', name: 'Áttekintés'}, // influencer
            {url: 'https://account.socialboom.hu/company/campaign/list/', icon: 'list-circle', name: 'Kampányaim'},
            {url: 'https://account.socialboom.hu/company/campaign/add/', icon: 'add-circle', name: 'Új kampány'}
        ]);}

        if (role == 2) {setMenu([
            {url: 'https://account.socialboom.hu/', icon: 'home', name: 'Áttekintés'}, // company
            {url: 'https://account.socialboom.hu/influencer/campaign/list/', icon: 'megaphone', name: 'Kampányok'},
            {url: 'https://account.socialboom.hu/influencer/application/list/', icon: 'star', name: 'Jelentkezések'}
        ]);}
        return () => {};
    },[role]);


    // Back btn
    function handleBackButtonClick() { webViewRef.current.goBack(); return true; }
    useEffect(() => {
        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => {
            BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
        };
    }, []);

    




    // Navigáció
    const loadBack = () => { if (!errorState) {webViewRef.current.goBack();} };
    const loadHome = () => { setWebviewSource({ uri: menu[0].url + '?t='+ Date.now(),headers: {Cookie: savedCookies},  }); setErrorState(false); };
    const loadSecond = () => { setWebviewSource({ uri: menu[1].url + '?t='+ Date.now(),  }); setErrorState(false); };
    const loadThird = () => { setWebviewSource({ uri: menu[2].url + '?t='+ Date.now(),  }); setErrorState(false); };
    const refresh = () => { setWebviewSource({ uri: menu[0].url + '?t='+ Date.now(),  }); setErrorState(false); };

    const debug = () => {
        console.debug("============================= DEBUGGER =============================");
        console.debug("mobileID state: " + mobileID);
        console.debug("role state: " + role);
        console.debug("savedCookies state: " + savedCookies);
        console.debug("============================= ........ =============================");
    }

  
    // JS - nozoom, cookie bar
    const runFirst = `const meta = document.createElement(\'meta\'); meta.setAttribute(\'content\', \'width=device-width, initial-scale=1, maximum-scale=0.99, user-scalable=0\'); meta.setAttribute(\'name\', \'viewport\'); document.getElementsByTagName(\'head\')[0].appendChild(meta);true;`;

    function handleWebViewError(error) {
        setErrorState(true);
        setWebviewSource({ html: "<b>Ellenőrizd az internetkapcsolatot!</b>" });
    }

    function _onNavigationStateChange(webViewState){

        console.log("statechange..." + webViewState.url);
        debug();
        //if (webViewState.url.includes('account.socialboom.hu/#') || webViewState.url.includes('account.socialboom.hu/logout')){

            //setSavedCookies(savedCookies.replace("SocialSession","SocialSessionOld"));

        //}
            //console.log("MEGTÖRTÉNT A LOGOUT");
            /*
            (async () => { try { 
                await StorageHelper.removeItem('mobileId'); 
                await StorageHelper.removeItem('cookies'); 
            } catch(e) {
                console.log("remove error")
            } finally {
                setSavedCookies(null);
                setMobileID(null);
                setRole(3);  
                setWebviewSource({ uri: 'https://account.socialboom.hu/#', headers: '' }); setErrorState(false);
                console.log("Logout end part");
                debug();
            }
             });
             */
        //} else {
            const CHECK_COOKIE = `
            ReactNativeWebView.postMessage("Cookie: " + document.cookie);
            true;
        `;
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(CHECK_COOKIE);
            }
            
        //}

    }

    _onMessage = (event) => {
            console.log("onmessage...")
            debug();
            var { data } = event.nativeEvent;
            console.log("actual cookies: " + data);
            data = data.replace("Cookie: ","");

            if(data.includes("SocialSession")){
                console.log("aha, itt menteni kell");
                (async () => { 
                    try { 
                        setSavedCookies(data);
                        await StorageHelper.setItem('cookies',data); 
                    } catch(e) {console.log(e)} })();
            }
            
            setMobileIdSetted(false);
            
            cookies = data.split("; ");

            cookies.forEach((cookie) => {
                values = cookie.split("=");
                if(values[0] == "SocialSession"){
                    
                    setMobileID(values[1]);
                    (async () => { 
                        try { 
                            setMobileIdSetted(true);
                            console.log("mobile ID set...");
                            await StorageHelper.setItem('mobileId',values[1]);                               
                        } catch(e) {console.log(e)} })();
                }
        
            });
            if (mobileIdSetted == false){
                //setMobileID(null);
                console.log("mobile id NULL!!")
            } 
        //}
    }

    _onLoadEnd = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log("onloadend..." + nativeEvent.url)
    }




    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.SafeArea}>
                {(() => {
                    if (errorState){
                        return (
                            <View style={styles.error}>
                                <Text>Ellenőrizd az internetkapcsolatot!</Text>
                                <TouchableWithoutFeedback onPressIn={refresh}>
                                    <View style={styles.bottomButton}>
                                        <Ionicons name="refresh" size={48} color={Colors.iconColor} />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        )
                    } else {
                        return (
                            <WebView
                                ref={webViewRef}
                                style={styles.webview}
                                
                                javaScriptEnabled={true}
                                injectedJavaScript={runFirst}
                                injectedJavaScriptBeforeContentLoaded={"document.cookie=" + savedCookies + ";"}
                                source={webviewSource}
                                onError={handleWebViewError}
                                scalesPageToFit={false}
                                onMessage={_onMessage}
                                onNavigationStateChange={_onNavigationStateChange.bind(this)}
                                onLoadEnd={_onLoadEnd}
                            />
                        )
                    }
                })()}
                
                {(() => {
                    if (role == 0 || role == 1 || role == 2){
                        return (
                            <View style={styles.bottombar}>
                                <TouchableWithoutFeedback onPressIn={loadBack}>
                                    <View style={styles.bottomButton}>
                                        <Ionicons name="chevron-back" size={24} color={Colors.iconColor} />
                                    </View>
                                </TouchableWithoutFeedback>

                                <TouchableWithoutFeedback onPressIn={loadHome}>
                                    <View style={styles.bottomButton}>
                                        <Ionicons name={menu[0].icon} size={24} color={Colors.iconColor} />
                                        <Text style={styles.menuText}>{menu[0].name}</Text>
                                    </View>
                                </TouchableWithoutFeedback>

                                <TouchableWithoutFeedback onPressIn={loadSecond}>
                                    <View style={styles.bottomButton}>
                                        <Ionicons name={menu[1].icon} size={24} color={Colors.iconColor} />
                                        <Text style={styles.menuText}>{menu[1].name}</Text>
                                    </View>
                                </TouchableWithoutFeedback>

                                <TouchableWithoutFeedback onPressIn={loadThird}>
                                    <View style={styles.bottomButton}>
                                        <Ionicons name={menu[2].icon} size={24} color={Colors.iconColor} />
                                        <Text style={styles.menuText}>{menu[2].name}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        )
                    }
                })()}
                    
            </SafeAreaView>
        </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
    SafeArea: {
        flex: 1,
        backgroundColor: "white",
    },
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    bottombar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: Colors.menuBgColor,
    },
    bottomButton: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',

    },
    error: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 10,
        marginTop: 2,
        color: Colors.menuTextColor,
    }
});

