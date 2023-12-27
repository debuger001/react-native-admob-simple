
import React, { useEffect, useState } from 'react';

import { Text, View } from "react-native";

import mobileAds, {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  AppOpenAd,
  RewardedInterstitialAd,
  TestIds
} from 'react-native-google-mobile-ads';

mobileAds()
.initialize()
.then(adapterStatuses => {
  if(__DEV__) {
    console.log('adapterStatuses: ', adapterStatuses);
  }
});

const SETTINGS = require('./settings.json');

const ADS_UNITS = { IDS: {}, CONTROLS: {} };

for(let key in SETTINGS) {
  if(undefined !== SETTINGS[key]) {
    if(undefined !== SETTINGS[key].ID) {
      if(!__DEV__ && SETTINGS[key].ID !== '') {
        ADS_UNITS.IDS[key] = SETTINGS[key].ID;
      }
      else {
        ADS_UNITS.IDS[key] = ((undefined !== TestIds[key])? TestIds[key]: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy');
      }
    }
  }
}

const ADMOB_BANNER = ({ bannerSize="BANNER", loaded=()=>{}, failed=(err)=>{}, opened=()=>{}, closed=()=>{} }) => {
  const [refreshBanner, setRefreshBanner] = useState(false);

  const REFRESH_TIME = parseInt((undefined !== SETTINGS[bannerSize].REFRESH_TIME)? SETTINGS[bannerSize].REFRESH_TIME: 0);

  useEffect(() => {
    TIMER.hooks.push({
      check: ((REFRESH_TIME > 0)? REFRESH_TIME: 0),
      execute: () => { setRefreshBanner(true); setTimeout(()=>{setRefreshBanner(false);}, 10) },
    });
  }, []);

  const BANNER_SIZE = (BannerAdSize[bannerSize] !== undefined)? BannerAdSize[bannerSize]: 'BANNER';

  const BANNER_AD_ID = (!__DEV__)? ADS_UNITS.IDS[bannerSize]: TestIds.BANNER;

  let CONTAINER_STYLE = {};
  if(undefined !== SETTINGS[bannerSize]) {
    if(undefined !== SETTINGS[bannerSize].CONTAINER_STYLE) {
      CONTAINER_STYLE = SETTINGS[bannerSize].CONTAINER_STYLE;
    }
  }

  return (
    <View style={((__DEV__)? { borderWidth: 1, borderColor: 'red', backgroundColor: '#e9e9e9', ...CONTAINER_STYLE}: CONTAINER_STYLE)}>
      { __DEV__ && (<Text style={{ position: 'absolute', left: 10, top: 10, backgroundColor: 'black', color: 'yellow', fontSize: 20, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: 'red', zIndex: 1 }}>{ TIMER.timer }</Text>) }
      { !refreshBanner && 
        <BannerAd
          unitId={BANNER_AD_ID}
          size={BANNER_SIZE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
            requestAgent: 'CoolAds',
            keywords: ['fashion', 'clothing'],
          }}
          onAdLoaded={()=>{ if('function' === typeof loaded){ loaded() } else { if(__DEV__){ console.log('BANNER (' + bannerSize + ') is loaded') } } }}
          onAdFailedToLoad={(err)=>{ if('function' === typeof failed){ failed(err) } else { if(__DEV__){ console.log('BANNER (' + bannerSize + ') is failed to load: '); console.error(err) } } }}
          onAdOpened={()=>{ if('function' === typeof opened){ opened() } else { if(__DEV__){ console.log('BANNER (' + bannerSize + ') is opened') } } }}
          onAdClosed={()=>{ if('function' === typeof closed){ closed() } else { if(__DEV__){ console.log('BANNER (' + bannerSize + ') is closed') } } }}
        />
      }
    </View>
  )
}

const ADMOB_APP_OPEN = {
  
  init: () => {
    ADS_UNITS.CONTROLS['APP_OPEN'] = AppOpenAd.createForAdRequest(ADS_UNITS.IDS['APP_OPEN'], { keywords: ['fashion', 'clothing'], });
    ADS_UNITS.CONTROLS['APP_OPEN'].load();
  },
  
  show: () => {
    if(__DEV__) { console.log('ADMOB_APP_OPEN (show)'); }
    try{
      ADS_UNITS.CONTROLS['APP_OPEN'].show();
    }
    catch(ex) {
      if(__DEV__) {
        console.error('error', ex.message);
      }
    }
  }
}

const ADMOB_INTERSTITIAL = {
  
  init: () => {
    const [loaded, setLoaded] = useState(false);

    ADS_UNITS.CONTROLS['INTERSTITIAL'] = InterstitialAd.createForAdRequest(ADS_UNITS.IDS['INTERSTITIAL'], { keywords: ['fashion', 'clothing'], });

    useEffect(()=>{
      const unsubscribe = ADS_UNITS.CONTROLS['INTERSTITIAL'].addAdEventListener(AdEventType.LOADED, () => {
        if(__DEV__) { console.log('ADMOB_INTERSTITIAL (loaded)'); }
        setLoaded(true);
      });

      ADS_UNITS.CONTROLS['INTERSTITIAL'].load();
      return unsubscribe;
    }, []);

    if (!loaded) { return null; }
  },
  
  show: () => {
    if(__DEV__) { console.log('ADMOB_INTERSTITIAL (show)'); }
    try{
      ADS_UNITS.CONTROLS['INTERSTITIAL'].show();
    }
    catch(ex) {
      if(__DEV__) {
        console.error('error', ex.message);
      }
    }
  }
}

const ADMOB_REWARDED = {
  
  init: (callback) => {
    const [loaded, setLoaded] = useState(false);

    ADS_UNITS.CONTROLS['REWARDED'] = RewardedAd.createForAdRequest(ADS_UNITS.IDS['REWARDED'], { keywords: ['fashion', 'clothing'], });

    useEffect(()=>{
      const unsubscribeLoaded = ADS_UNITS.CONTROLS['REWARDED'].addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
      });
      
      const unsubscribeEarned = ADS_UNITS.CONTROLS['REWARDED'].addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          if(__DEV__) {
            console.log('ADMOB_REWARDED: User earned reward of ', reward);
          }
          if('function' === typeof callback) {
            callback(reward);
          }
        },
      );
  
      ADS_UNITS.CONTROLS['REWARDED'].load();
      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
      };
    }, []);

    if (!loaded) { return null; }
  },
  
  show: () => {
    if(__DEV__) { console.log('ADMOB_REWARDED (show)'); }
    try{
      ADS_UNITS.CONTROLS['REWARDED'].show();
    }
    catch(ex) {
      if(__DEV__) {
        console.error('error', ex.message);
      }
    }
  }
}

const ADMOB_REWARDED_INTERSTITIAL = {
  
  init: (callback) => {
    const [loaded, setLoaded] = useState(false);

    ADS_UNITS.CONTROLS['REWARDED_INTERSTITIAL'] = RewardedInterstitialAd.createForAdRequest(ADS_UNITS.IDS['REWARDED_INTERSTITIAL'], { keywords: ['fashion', 'clothing'], });

    useEffect(()=>{
      const unsubscribeLoaded = ADS_UNITS.CONTROLS['REWARDED_INTERSTITIAL'].addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
      });
      
      const unsubscribeEarned = ADS_UNITS.CONTROLS['REWARDED_INTERSTITIAL'].addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          if(__DEV__) {
            console.log('ADMOB_REWARDED_INTERSTITIAL: User earned reward of ', reward);
          }
          if('function' === typeof callback) {
            callback(reward);
          }
        },
      );
  
      ADS_UNITS.CONTROLS['REWARDED_INTERSTITIAL'].load();
      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
      };
    }, []);

    if (!loaded) { return null; }
  },
  
  show: () => {
    if(__DEV__) { console.log('ADMOB_REWARDED_INTERSTITIAL (show)'); }
    try{
      ADS_UNITS.CONTROLS['REWARDED_INTERSTITIAL'].show();
    }
    catch(ex) {
      if(__DEV__) {
        console.error('error', ex.message);
      }
    }
  }
}

const TIMER = {

  timer: 0,
  hooks: [{}],

  started: false,

  init () {
    if(!this.started) {
      this.started = true;
      setInterval(() => {
        this.timer ++;
        if(this.timer > 86400) { this.timer = 0; }
        for(let hook of this.hooks) {
          if(hook.check >= 0) {
            if(this.timer % hook.check === 0) {
              if(typeof hook.execute === 'function') {
                hook.execute();
              }
            }
          }
        }
      }, 1000);
    }
  },

}

TIMER.init();

export {
  ADMOB_BANNER,
  ADMOB_APP_OPEN,
  ADMOB_INTERSTITIAL,
  ADMOB_REWARDED,
  ADMOB_REWARDED_INTERSTITIAL
}
