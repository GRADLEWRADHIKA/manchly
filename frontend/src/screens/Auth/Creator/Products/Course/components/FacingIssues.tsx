import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CloudUpload } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../../utils/responsive';

const FacingIssues = ({ messgae, title }: { messgae?: string; title: string }) => {
    return (
        <View style={styles.uploadHeader}>
            <View style={styles.uploadMain}>
                <CloudUpload width={wp(36)} height={hp(36)} color={'#6B7280'} />
                <Text style={styles.mainPara}>{title}</Text>
                <TouchableOpacity
                    activeOpacity={0.8}
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
                                        position: 'top',
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
                                    position: 'top',
                                });
                            });
                    }}
                >
                    <LinearGradient
                        colors={['#F5D98F', '#D89E3F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.buttonHelp}
                    >
                        <Text style={styles.buttonHelpPara}>Get help!</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default FacingIssues

const styles = StyleSheet.create({
    uploadHeader: {
        marginTop: hp(20),
    },
    uploadMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(18),
        borderRadius: wp(18),
        backgroundColor: '#141414',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: wp(14),
    },
    mainPara: {
        flex: 1,
        fontSize: fp(15),
        fontWeight: '500',
        color: 'rgba(255,255,255,0.55)',
        lineHeight: fp(21),
    },
    buttonHelp: {
        borderRadius: wp(14),
        paddingVertical: hp(10),
        paddingHorizontal: wp(18),
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonHelpPara: {
        fontSize: fp(14.5),
        color: '#1A1A1A',
        fontWeight: '700',
    },
})
