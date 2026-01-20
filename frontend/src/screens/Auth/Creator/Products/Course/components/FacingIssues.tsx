import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CloudUpload } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../../../utils/colors';

const FacingIssues = ({ messgae, title }) => {
    return (
        <View>
            <View style={styles.uploadHeader}>
                <View style={styles.uploadMain}>
                    <View style={styles.secHead}>
                        <CloudUpload width={40} height={40} color={colors.primary} />
                    </View>
                    <View style={styles.mainHead}>
                        <Text style={styles.mainPara}>{title}</Text>
                    </View>
                    <View style={{ width: '5%' }}></View>
                    <TouchableOpacity
                        style={styles.buttonHelp}
                        onPress={() => {
                            const phoneNumber = '6363790659';
                            const message = messgae || 'Hello, I need help with uploading.';
                            const url = `whatsapp://send?phone=91${phoneNumber}&text=${encodeURIComponent(
                                message,
                            )}`;

                            Linking.canOpenURL(url)
                                .then(supported => {
                                    if (!supported) {
                                        Toast.show({
                                            type: 'error',
                                            text1: 'WhatsApp not installed',
                                            text2: 'Please install WhatsApp to contact support',
                                            position: 'bottom',
                                        });
                                    } else {
                                        return Linking.openURL(url);
                                    }
                                })
                                .catch(err => {
                                    Toast.show({
                                        type: 'error',
                                        text1: 'Something went wrong',
                                        text2: err?.message || 'Unable to open WhatsApp',
                                        position: 'bottom',
                                    });
                                });
                        }}
                    >
                        <Text style={styles.buttonHelpPara}>Get help!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default FacingIssues

const styles = StyleSheet.create({
    buttonHelpPara: {
        fontSize: 14,
        color: colors.white,
        fontWeight: '500',
        borderRadius: 10,
    },
    uploadHeader: {
        alignItems: 'center',
        marginTop: 20,
    },
    uploadMain: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 10,
        backgroundColor: colors.white,
        elevation: 5,
        alignItems: 'center',
    },
    secHead: {
        width: '20%',
        alignItems: 'center',
    },
    mainHead: {
        width: '45%',
        alignItems: 'center',
    },
    mainPara: {
        fontSize: 16,
        fontWeight: '500',
    },
    buttonHelp: {
        width: '30%',
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 5,
    },
})