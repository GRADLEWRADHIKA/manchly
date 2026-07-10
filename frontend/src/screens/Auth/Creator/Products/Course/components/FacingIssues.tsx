import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CloudUpload } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../../utils/responsive';

const FacingIssues = ({ messgae, title }) => {
    return (
        <View>
            <View style={styles.uploadHeader}>
                <View style={styles.uploadMain}>
                    <View style={styles.secHead}>
                        <CloudUpload width={wp(40)} height={hp(40)} color={'#60A5FA'} />
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
        fontSize: fp(14),
        color: colors.white,
        fontWeight: '500',
        borderRadius: wp(10),
    },
    uploadHeader: {
        alignItems: 'center',
        marginTop: hp(20),
    },
    uploadMain: {
        flexDirection: 'row',
        padding: wp(16),
        borderRadius: wp(10),
        backgroundColor: colors.white,
        elevation: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
        fontSize: fp(16),
        fontWeight: '500',
        color: '#1A1A2E',
    },
    buttonHelp: {
        width: '30%',
        borderWidth: wp(1),
        alignItems: 'center',
        backgroundColor: '#0F3460',
        borderColor: '#0F3460',
        borderRadius: wp(5),
        paddingVertical: hp(5),
    },
})