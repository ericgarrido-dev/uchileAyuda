import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Text,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface Props {
  visible: boolean;
  imageUri: string | null;
  token: string | null;
  onClose: () => void;
}

export default function ModalPreviewScreen({ visible, imageUri, token, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <View style={styles.overlay}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vista previa</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {imageUri ? (
          <Image
            source={{
              uri: imageUri,
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="image" size={48} color="#64748b" />
            <Text style={styles.placeholderText}>No se pudo cargar la imagen</Text>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 14,
  },
});