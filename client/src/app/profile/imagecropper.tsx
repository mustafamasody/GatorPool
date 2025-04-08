import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  PixelCrop,
  ReactCropProps
} from "react-image-crop";
import setCanvasPreview from "./set_canvas_preview";
import fetchBase from "../../common/fetchBase";
import { AccountData } from "../view_controller";

interface ImageCropperProps {
    updateAvatar: (url: string) => void;
    accountData: AccountData;
    setAccountData: (accountData: AccountData) => void;
}

const ImageCropper = ({ updateAvatar, accountData, setAccountData }: ImageCropperProps) => {

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleUpload = () => {
        if (uploadedFile) {

            const formData = new FormData();
            formData.append("files", uploadedFile);
            formData.append("type", "profile_picture");

            fetch(`${fetchBase}/v1/account/idp/pfp`, {
                method: "POST",
                body: formData,
                credentials: "include",
                headers: {
                    "X-GatorPool-Device-Id": localStorage.getItem("X-GatorPool-Device-Id") || "",
                    "X-GatorPool-Username": localStorage.getItem("X-GatorPool-Username") || "",
                },
            }).then((res) => res.json()).then((data) => {
                if(data.success) {
                    updateAvatar(data.url);
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    };

    return (
        <>
            <label className="block mb-3 w-fit">
                <span className="sr-only">Choose picture</span>
                <input
                    type="file"
                    accept="image/*"
                    className="className=block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full 
                    file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
                    onChange={handleFileChange}
                />

                {
                    uploadedFile && (
                        <button onClick={handleUpload} className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-4 py-2">Upload</button>
                    )
                }
            </label>
        </>
    );
};

export default ImageCropper;
