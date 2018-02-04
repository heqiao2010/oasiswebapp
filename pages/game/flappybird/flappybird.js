// pages/game/flappybird.js
//map.js
var interval
var interval_life
// 障碍树
var list_tree = Array
// 得分
var point
// 最小预留空隙(%)
var space_min = 20
var space_max = 30
// 树空隙的Y坐标（%）
var space_y_min = 20
var space_y_max = 70
// 树宽度(%)
var tree_width = 20
// 树间距(%)
var tree_dist = 40
// 树颜色
var tree_colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
// 小鸟半径
var bird_rad = 20
// 小鸟x坐标
var bird_x = 100
// 小鸟y坐标
var bird_y = 375
// 背景颜色
var bg_color = "#6cbaee"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    msg: "default",
    width: 0,
    height: 0,
    //cur_bird_y: 0,
    is_touched: false,
    hidden: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    // 获取系统尺寸
    wx.getSystemInfo({
      success: function (res) {
        // success
        console.info(res.windowWidth + ',' + res.windowHeight);
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this
    //this.drawFace()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.startGame()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.pauseGame()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.pauseGame()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },


  // 描画页面
  drawView: function () {
    var that = this
    // 移动故障树
    this.moveTree(this.data.width, this.data.height)

    // 描画
    var context = wx.createContext()
    this.drawBackground(context)
    this.drawTree(context)
    this.drawPoint(context)
    this.drawBird(context)
    wx.drawCanvas({
      canvasId: 'game_canvas',
      actions: context.getActions() // 获取绘图动作数组
    })

    // 判断是否挂掉
    if (this.isDie()) {
      this.stopGame()
    }
  },

  // 描画背景障碍物
  drawBackground: function (context) {
    context.drawImage("../../../images/bg.png", 0, 0, this.data.width, this.data.height)
  },

  // 描画障碍树
  drawTree: function (context) {
    list_tree.forEach(function (tree) {
      //context.setStrokeStyle(tree.color)
      context.setFillStyle(tree.color)
      context.setLineWidth(10)
      context.rect(tree.xStart, tree.yUpStart, tree.xStop - tree.xStart, tree.yUpStop - tree.yUpStart)
      context.fill()
      //context.stroke()
      context.rect(tree.xStart, tree.yDownStart, tree.xStop - tree.xStart, tree.yDownStop - tree.yDownStart)
      context.fill()
      context.stroke()
    })
  },

  // 描画小鸟
  drawBird: function (context) {
    context.moveTo(bird_x, bird_y)
    if (this.data.is_touched) {
      bird_y = bird_y - 20
    }
    else {
      bird_y = bird_y + 20
    }
    /*
    context.setLineWidth(2)
    
    context.arc(bird_x, bird_y, bird_rad, 0, 2 * Math.PI, true)
    context.fill()
    context.stroke()
    */
    context.drawImage("../../../images/bird.jpg", bird_x - bird_rad, bird_y - bird_rad, bird_rad * 2, bird_rad * 2)
  },

  // 描画得分
  drawPoint: function (context) {
    context.setFontSize(20)
    context.fillText("得分：" + point, this.data.width / 2 - 50, 30)
    context.stroke()
  },

  // 开始游戏
  startGame: function () {
    var that = this
    // 得分
    point = 0
    // 小鸟
    if (this.data.height > 0) {
      bird_y = this.data.height / 2
    }
    // 树
    list_tree = [] // 清空数组
    list_tree.push(this.createNewTree(this.data.width, this.data.height))
    interval = setInterval(function () {
      that.drawView()
    }, 300)
  },

  pauseGame: function () {
    clearInterval(interval)
  },

  stopGame: function () {
    var that = this
    clearInterval(interval)

    // 最高纪录
    var topPoint = wx.getStorageSync('game_flappybird') || 0
    if (point > topPoint) {
      topPoint = point
      wx.setStorageSync('game_flappybird', topPoint)
    }

    var userInfo = wx.getStorageSync('user') || 'None'
    console.log('info: ' + userInfo)
    // 上传用户信息
    wx.request({
      url: 'https://oasisatauth.h3c.com/webserver/game/rank',
      method: 'POST',
      data: {
        user: userInfo,
        topPoint: topPoint
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        // success
      },
      fail: function () {
        wx.showToast({
          title: '数据同步中...',
          icon: 'loading',
          duration: 2000
        })
      }
    })
    
    wx.showActionSheet({
      itemList: ['查看排行榜', '重来（得分：' + point + '，最嘉：' + topPoint + ')', '退出'],
      success: function (res) {
        switch (res.tapIndex){
          case 0:
            wx.navigateTo({
              url: '../rank/rank'
            })
            break;
          case 1:
            that.startGame()
            break;
          case 2:
            wx.navigateBack({
              delta: 1, // 回退前 delta(默认为1) 页面
              success: function (res) {
                // success
              },
              fail: function () {
                // fail
              },
              complete: function () {
                // complete
              }
            })
            break;
          default:
            console.log(res.errMsg)
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
        wx.showToast({
          title: '操作失败 ' + res.errMsg,
          icon: 'loading',
          duration: 2000
        }) 
      }
    })  
    },

    
  // 创建一个新树
  createNewTree: function (width, height) {
    var randVar = new Date().getTime()  // 取当前时间戳作为随机数

    var yStartRate = randVar % (space_y_max - space_y_min) + space_y_min
    var spaceRate = randVar % (space_max - space_min) + space_min
    var yStart = height * yStartRate / 100
    var space = height * spaceRate / 100
    var yUpStart = 0
    var yUpStop = yStart
    var yDownStart = yStart + space
    var yDownStop = height
    var xStart = width * (100 - tree_width) / 100
    var xStop = width
    //var color = tree_colors[randVar % tree_colors.length]
    var color = tree_colors[1]

    return {
      yUpStart: yUpStart, yUpStop: yUpStop, yDownStart: yDownStart, yDownStop: yDownStop,
      xStart: xStart, xStop: xStop, color: color
    }
  },

  // 移动树
  moveTree: function (scrWidth, scrHeight) {
    var leftTreeStop = scrWidth
    var rightTreeStop = 0

    list_tree.forEach(function (tree) {
      tree.xStart = tree.xStart - 10
      tree.xStop = tree.xStop - 10
      if (tree.xStop < leftTreeStop) {
        leftTreeStop = tree.xStop
      }
      if (tree.xStop > rightTreeStop) {
        rightTreeStop = tree.xStop
      }
    })

    if (leftTreeStop < 0) {
      // 删除第一棵树
      list_tree.shift()
      // 得分+1
      point = point + 1
    }
    // 最右的树边界小于树间距时新增树
    if (rightTreeStop < scrWidth * tree_dist / 100) {
      // 新增一棵树
      list_tree.push(this.createNewTree(scrWidth, scrHeight))
    }
  },

  //  是否挂掉
  isDie: function (scrHeight) {
    if (bird_y + bird_rad > scrHeight) {
      return true
    }
    if (bird_y - bird_rad < 0) {
      return true
    }

    for (var i = 0; i < list_tree.length; i++) {
      if (list_tree[i].xStart < bird_x + bird_rad && list_tree[i].xStop > bird_x - bird_rad) {
        if (bird_y - bird_rad < list_tree[i].yUpStop || bird_y + bird_rad > list_tree[i].yDownStart) {
          return true
        }
      }
    }

    return false
  },

  // 用户点击开始
  touchstart: function () {
    //wx.showToast({title:"touchstart!"})
    this.data.is_touched = true
  },

  touchmove: function () {
    //wx.showToast({title:"touchmove!"})
  },

  touchend: function () {
    //wx.showToast({title:"touchend!"})
    this.data.is_touched = false
  },

  touchcancel: function () {
    //wx.showToast({title:"touchcancel!"})
    this.data.is_touched = false
  }
})

