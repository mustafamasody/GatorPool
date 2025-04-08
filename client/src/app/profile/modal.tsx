import CloseIcon from '../components/closeicon';
import { AccountData } from '../view_controller';
import ImageCropper from './imagecropper';

interface ModalProps {
  updateAvatar: (url: string) => void;
  closeModal: () => void;
  accountData: AccountData;
  setAccountData: (accountData: AccountData) => void;
}

const Modal = ({ updateAvatar, closeModal, accountData, setAccountData }: ModalProps) => {
  return (
    <div
      className="relative z-40 "
      aria-labelledby="crop-image-dialog"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-all backdrop-blur-sm" ></div>
      <div className="fixed inset-0 z-40 w-screen overflow-y-auto" >
        <div className="flex min-h-full justify-center px-2 py-12 text-center " >
          <div className="relative w-[55%] sm:w-[40%] min-h-[60vh] rounded-2xl bg-gray-900 text-slate-100 text-left shadow-xl transition-all">
            <div className="px-5 py-4">
              <button
                type="button"
                className="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:bg-gray-700 focus:outline-none absolute top-2 right-2"
                onClick={closeModal}
              >
                <span className="sr-only">Close menu</span>
                <CloseIcon />
              </button>
              <ImageCropper updateAvatar={updateAvatar} accountData={accountData} setAccountData={setAccountData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Modal;