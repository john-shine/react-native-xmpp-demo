import SQLite from 'react-native-sqlite-storage';
import {formatDateDay} from "./common";

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class sqLiteManager {

    constructor(args) {
        this.dbInstance = null;
        this.chatTableName = 'user_chats';
        this.createChatTableSQL = 'CREATE TABLE IF NOT EXISTS ' + this.chatTableName + ' (' +
            'id INTEGER PRIMARY KEY,' +
            'mid VARVHAR NOT NULL UNIQUE,' + // messageId
            'body TEXT NOT NULL,' +
            'user_id INTEGER NOT NULL,' +
            'chat_with_user_id INTEGER NOT NULL,' +
            'is_send BOOLEAN NOT NULL DEFAULT TRUE,' + // send (true) or receive (false)
            'status SMALLINT,' +
            'create_timestamp INTEGER,' +
            'update_timestamp INTEGER' +
        ')';
    }

    openDB() {
        return SQLite.openDatabase({name: 'storage', version: 'v1', location: 'default'});
    }

    closeDB() {
        return this.dbInstance.close();
    }

    execute(sql, args) {
        return this.dbInstance.executeSql(sql, args);
    }

    createChatTable() {
        return this.execute(this.createChatTableSQL);
    }

    getChatItem(mid, body, userId, chatWithUserId, isSend, status, create_timestamp, update_timestamp) {
        return {
            'mid': mid,
            'body': body,
            'user_id': userId,
            'chat_with_user_id': chatWithUserId,
            'is_send': isSend,
            'status': status,
            'create_timestamp': create_timestamp ? create_timestamp : Date.now(),
            'update_timestamp': update_timestamp ? update_timestamp : Date.now()
        }
    }

    insertChatItem(chatItem) {
        console.log('insert chat Item: ', chatItem);
        return this.execute(
          'INSERT OR REPLACE INTO ' + this.chatTableName +
            '("mid", "body", "user_id", "chat_with_user_id", "is_send", "status", "create_timestamp", "update_timestamp") ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [chatItem.mid, chatItem.body, chatItem.user_id, chatItem.chat_with_user_id, chatItem.is_send, chatItem.status, chatItem.create_timestamp, chatItem.update_timestamp]
        );
    }

    updateChatItem(chatId, args) {
        if (!args) {
            console.warn('update chat get empty args.');
            return false;
        }

        if ( !('update_timestamp' in args) ) {
            args['update_timestamp'] = Date.now();
        }

        console.log('update chat mssage: ' + chatId + 'to: ', args);
        let sql = 'UPDATE ' + this.chatTableName + ' SET ';
        let i = 1;
        let values = [];
        for (let k in args) {
            if (i === Object.keys(args).length) {
                sql += k + '=?';
            } else {
                sql += k + '=?,';
            }

            i++;
            values.push(args[k]);
        }
        sql += ' WHERE mid=?';
        values.push(chatId);

        return this.execute(sql, values);
    }

    queryChats(userId, chatWithUserId, limit) {
        console.log('query chats ' + userId + ' with ' + chatWithUserId + ' limit: ', limit);
        return new Promise((resolve, reject) => {
            this.execute(
                'SELECT * from ' + this.chatTableName +
                ' WHERE user_id=? AND chat_with_user_id=? ORDER BY id DESC LIMIT ?',
                [userId, chatWithUserId, limit ? limit : 10]
            ).then((results) => {
                console.log("query chats completed", results);

                let lists = [];
                let rows = results[0].rows;

                for (let i = 0; i < rows.length; i++) {
                    let row = rows.item(i);
                    lists.push({
                        'id': row.id,
                        'mid': row.mid,
                        'body': row.body,
                        'user_id': row.user_id,
                        'chat_with_user_id': row.chat_with_user_id,
                        'is_send': row.is_send,
                        'status': row.status,
                        'time': formatDateDay(new Date(row.create_timestamp)),
                        'create_timestamp': row.create_timestamp,
                        'update_timestamp': row.update_timestamp
                    });
                }
                resolve(lists.sort(function(a, b) {return a.id - b.id;}));
            }).catch(err => {
                reject(err);
            });
        })
    }

}

export { sqLiteManager }