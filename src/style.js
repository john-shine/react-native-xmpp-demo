import {StyleSheet, Dimensions} from "react-native";

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    headerBox: {
        height: 51,
        shadowColor: '#000',
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.02,
        elevation: 4,
        backgroundColor: '#fff',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden',
    },
    connectInfoText: {
        backgroundColor: '#f00'
    },
    chatContent: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    chatInputBox: {
        width: '100%',
        height: 50,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: '#fff',
    },
    userInput: {
        height: 40,
    },
    rowLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userAvatar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    chatAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    padding5: {
        padding: 5,
    },
    sendBtn: {
        width: 60,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInputBox: {
        flex: 1,
        marginLeft: 15,
        borderRadius: 4,
        backgroundColor: '#E5E5E5',
    },
    rowList: {
        marginVertical: 15,
    },
    messageText: {
        fontSize: 14,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        lineHeight: 24,
        maxWidth: width - 80,
    },
    sendTime: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.6)',
        textAlign: 'center',
        marginTop: 10,
    },
    flex_row: {
        flexDirection: 'row',
    },
    flex_left: {
        marginRight: 10,
    },
    flex_right: {
        marginLeft: 10,
        justifyContent: 'flex-end',
    },
    left_box: {
        justifyContent: 'flex-start',
    },
    right_box: {
        justifyContent: 'flex-end',
    },
    sendBoxBg: {
        backgroundColor: '#2188FF',
    },
    receiveBoxBg: {
        backgroundColor: '#FFBE49',
    },
});

export default styles;