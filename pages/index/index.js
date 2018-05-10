const weatherMap = {
    'sunny': '晴天',
    'cloudy': '多云',
    'overcast': '阴',
    'lightrain': '小雨',
    'heavyrain': '大雨',
    'snow': '雪'
}

const weatherColorMap = {
    'sunny': '#cbeefd',
    'cloudy': '#deeef6',
    'overcast': '#c6ced2',
    'lightrain': '#bdd5e1',
    'heavyrain': '#c5ccd0',
    'snow': '#aae1fc'
}

const UNPROMPTED = 0; //
const UNAUTHORIZED = 1; //点击了取消按钮
const AUTHORIZED = 2; //点击了同意按钮

Page({
    data: {
        nowTemp: '',
        nowWeather: '',
        nowWeatherBackground:'',
        hourlyWeather: [],
        todayTemp: '',
        todayDate: '',
        city: '广州市',
        locationAuthType: UNPROMPTED
    },
    onLoad() {
        wx.getSetting({
            success: res => {
                let auth = res.autoSetting['scope.userLocation']
                this.setData({
                    locaAuthType = auth ? AUTHORIZED : (auth===false) ? UNAUTHORIZED : UNPROMPTED
                })
                if(auth) {
                    this.getCityAndWeather()
                }else {
                    this.getNow()
                }
            }
        })
    },
    onPullDownRefresh() {
        this.getNow(() => {
            wx.stopPullDownRefresh()
        })
    },
    getNow(callback) {
        wx.request({
            url: 'https://test-miniprogram.com/api/weather/now',
            data: {
                city: this.data.city
            },
            success: res => {
                console.log(res);
                let result = res.data.result;
                this.setNow(result);
                this.setHourlyWeather(result);
                this.setTody(result);                
            },
            complete: () => {
                callback && callback()
            }
        })
    },
    setNow(result) {
        let temp = result.now.temp,
            weather = result.now.weather;
        this.setData({
            nowTemp: temp + "°",
            nowWeather: weatherMap[weather],
            nowWeatherBackground: '/images' + weather + '-bg.png'
        })
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: weatherColorMap[weather]
        })
    },
    setHourlyWeather(result) {
        let forecast = result.forecast,
            hourlyWeather = [],
            nowHour = new Date().getHours();
        for (let i = 0; i < 8; i += 1) {
            hourlyWeather.push({
                time: (i*3 + nowHour) % 24 + "时",
                iconPath: '/images/' + forecast[i].weather + '-icon.png',
                temp: forecast[i].temp + '°'
            })
        }
        hourlyWeather[0].time = '现在'
        this.setData({
            hourlyWeather: hourlyWeather
        })
    },
    setTody(result) {
        let date = new Date()
        this.setData({
          todayTemp: `${result.today.minTemp}° - ${result.today.maxTemp}°`,
          todayDate: `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 今天`
        })
    },
    onTapDayWeather () {
        wx.navigateTo({
            url: '/pages/list/list?city=' + this.data.city
        })
    },
    onTapLocation() {
        if(this.data.locaAuthType === UNAUTHORIZED) {
            wx.openSetting({
                success: res => {
                    let auth = res.authSetting['scope.userLocation']
                    if(auth) {
                        this.getCityAndWeather()
                    }
                }
            })
        }else {
            this.getCityAndWeather()
        }
    },
    getCityAndWeather() {
        wx.getCityAndWeather({
            success: res =>{
                console.log(res.latitude, res.longitude)
                this.setData({
                    locaAuthType: AUTHORIZED
                })
                wx.request({
                    url: 'https://api.map.baidu.com/geocoder/v2/?ak=rDUlIMhzxU0tGC1dYfVrB68tDVwzwGaB&location=' + res.latitude + ',' + res.longitude + '&output=json&coordtype=wgs84ll',
                    success: res => {
                        this.setData({
                            city: res.data.result.addressComponent.city
                        })
                        this.getNow();
                    }
                })
            },
            fail: () => {
                this.setData({
                    locaAuthType: UNAUTHORIZED
                })
            }
        })
    }
})