/*
* @Author: dmyang
* @Date:   2016-12-06 16:07:38
* @Last Modified by:   dmyang
* @Last Modified time: 2017-01-05 11:59:17
*/

'use strict'

const request = require('./request')
const get = request.get
const post = request.post
const msgFormat = require('./msg-format')

let _config = {}

/**
 * 通用配置
 * @param     {Object} required config 配置
 * 可配置项：
 * {
 *       useSSL: false, // 是否调用https接口
 *       appSecret: '' // 从开放平台申请的appSecret
 *       appId: '' // 从开放平台申请的appId
 * }
 */
exports.config = config => {
    _config = config
}

const map = {
    // 非任务推送 pushId推送（通知栏消息）
    byPushId: {
        specialKey: 'pushIds',
        uri: '/garcia/api/server/push/varnished/pushByPushId'
    },
    // 非任务推送 别名推送（通知栏消息）
    byAlias: {
        specialKey: 'alias',
        uri: '/garcia/api/server/push/varnished/pushByAlias'
    },
    // 获取任务ID
    getTaskId: {
        specialKey: 'pushType',
        uri: '/garcia/api/server/push/pushTask/getTaskId'
    },
    // 任务推送 pushId推送（通知栏消息）
    taskByPushId: {
        isTask: true,
        specialKey: 'pushIds',
        uri: '/garcia/api/server/push/task/varnished/pushByPushId'
    },
    // 任务推送 别名推送（通知栏消息）
    taskByAlias: {
        isTask: true,
        specialKey: 'alias',
        uri: '/garcia/api/server/push/task/varnished/pushByAlias'
    },
    // 全部用户推送
    toApp: {
        specialKey: 'pushType',
        uri: '/garcia/api/server/push/pushTask/pushToApp'
    },
    // 取消任务推送（只针对全部用户推送待推送和推送中的任务取消）
    cancel: {
        isTask: true,
        specialKey: 'pushType',
        uri: '/garcia/api/server/push/pushTask/cancel'
    }
}

Object.keys(map).forEach(api => {
    let isTask = map[api].isTask
    let uri = map[api].uri
    let specialKey = map[api].specialKey

    if('pushType' !== specialKey) {
        exports[api] = (pushType, specialVal, taskIdOrMsg, callback, config) => {
            if(typeof callback !== 'function' && typeof callback == 'object') {
                config = callback
                callback = null
            }

            config = config ? Object.assign({}, _config, config) : _config

            // pushType 0->通知栏消息 1->透传消息
            if(pushType == 1 && /yPushId|yAlias/.test(api)) uri = uri.replace(/\bvarnished\b/, 'unvarnished')

            let params = { appId: config && config.appId ? config.appId : _config.appId }

            params[specialKey] = specialVal

            if(isTask) params.taskId = taskIdOrMsg
            else params.messageJson = msgFormat(taskIdOrMsg, pushType)

            if(callback) post(uri, params, config).then(result => {callback(null, result)}, callback)
            else return post(uri, params, config)
        }
    } else {
        exports[api] = (specialVal, taskIdOrMsg, callback, config) => {
            if(typeof callback !== 'function' && typeof callback == 'object') {
                config = callback
                callback = null
            }

            config = config ? Object.assign({}, _config, config) : _config

            let params = {
                appId: config && config.appId ? config.appId : _config.appId,
                pushType: specialVal
            }

            if(isTask) params.taskId = taskIdOrMsg
            else params.messageJson = msgFormat(taskIdOrMsg, specialVal)

            if(callback) post(uri, params, config).then(result => {callback(null, result)}, callback)
            else return post(uri, params, config)
        }
    }
})

/**
 * 应用标签推送
 */
exports.toTag = (pushType, msg, tagNames, scope, callback, config) => {
    if(typeof callback !== 'function') {
        config = callback
        callback = null
    }

    config = config ? Object.assign({}, _config, config) : _config

    const uri = '/garcia/api/server/push/pushTask/pushToTag'
    const params = {
        appId: config.appId ? config.appId : _config.appId,
        pushType,
        tagNames,
        scope,
        messageJson: msgFormat(msg, pushType)
    }

    if(callback) post(uri, params, config).then(result => {callback(null, result)}, callback)
    else return post(uri, params, config)
}

/**
 * 获取任务推送统计
 */
exports.getTaskStatistics = (taskId, callback, config) => {
    if(typeof callback !== 'function') {
        config = callback
        callback = null
    }

    config = config ? Object.assign({}, _config, config) : _config

    const uri = '/garcia/api/server/push/statistics/getTaskStatistics'
    const params = { 
        appId: config && config.appId ? config.appId : _config.appId,
        taskId
    }

    if(callback) get(uri, params, config).then(result => {callback(null, result)}, callback)
    else return get(uri, params, config)
}
