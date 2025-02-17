import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  PixelCrop,
  ReactCropProps
} from "react-image-crop";
import setCanvasPreview from "./set_canvas_preview";


const ImageCropper = () => {
    return (
        <>
            <label className="block mb-3 w-fit">
                <span className="sr-only">Choose picture</span>
                <input
                    type="file"
                    accept="image/*"
                    className="className=block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full 
                    file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
                />
            </label>
        </>
    );
};

export default ImageCropper;
