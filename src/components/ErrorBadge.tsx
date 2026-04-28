import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

export const ErrorBadge = ({ message }: { message: string }) => {
    if (!message) return null;

    return (
        <View style={styles.container}>
            <AntDesign name="exclamationcircle" size={16} color="#9f0712" />
            <Text style={styles.textError}>{message}</Text>
        </View>
    );
};

export const ValidBadge = () => {
    return (
        <View style={styles.containerValidate}>
            <AntDesign name="checkcircle" size={16} color="#016653" />
            <Text style={styles.textValid}>RUT válido</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffc9c9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
    },

    containerValidate: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbfce7',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
    },

    textError: {
        color: '#9f0712',
        marginLeft: 8,
        fontSize: 14,
    },

    textValid: {
        color: '#016653',
        marginLeft: 8,
        fontSize: 14,
    },
});