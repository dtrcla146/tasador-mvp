import { App } from "@capacitor/app";
import {
    Camera,
    CameraResultType,
    CameraSource,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export function isNativeCameraAvailable() {
    return Capacitor.isNativePlatform();
}

export async function takeNativePhoto() {
    const photo = await Camera.getPhoto({
        allowEditing: false,
        correctOrientation: true,
        quality: 100,
        resultType: CameraResultType.Uri,
        saveToGallery: false,
        source: CameraSource.Camera,
    });

    return photoToFile(photo);
}

export async function restoreNativePhotoListener(onPhoto, onError) {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    await App.addListener("appRestoredResult", async (event) => {
        if (
            event.pluginId !== "Camera" ||
            event.methodName !== "getPhoto" ||
            !event.success
        ) {
            return;
        }

        try {
            await onPhoto(await photoToFile(event.data));
        } catch (error) {
            console.error("No se pudo recuperar la foto de la cámara:", error);
            onError(error);
        }
    });
}

async function photoToFile(photo) {
    if (!photo.webPath) {
        throw new Error("La cámara no devolvió una ruta de imagen.");
    }

    const response = await fetch(photo.webPath);
    if (!response.ok) {
        throw new Error(`No se pudo leer la foto (${response.status}).`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || `image/${photo.format || "jpeg"}`;
    const extension = mimeType === "image/png" ? "png" : "jpg";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return new File([blob], `tasacion-${timestamp}.${extension}`, {
        type: mimeType,
        lastModified: Date.now(),
    });
}
