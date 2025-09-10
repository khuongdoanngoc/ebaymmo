// import Image from 'next/image';
// import { useGetUserStoresQuery } from '@/generated/graphql';

// interface SelectStoreModalProps {
//     userId: string;
//     onSelect: (storeId: string) => void;
//     onClose: () => void;
// }

// const SelectStoreModal = ({
//     userId,
//     onSelect,
//     onClose
// }: SelectStoreModalProps) => {
//     const { data, loading } = useGetUserStoresQuery({
//         variables: { userId }
//     });

//     //

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg p-6 w-[400px]">
//                 <h2 className="text-xl font-bold mb-4">Select a store</h2>

//                 {loading ? (
//                     <div className="space-y-4 max-h-[400px] overflow-y-auto">
//                         {[...Array(3)].map((_, index) => (
//                             <div
//                                 key={index}
//                                 className="w-full flex items-center gap-3 p-3 rounded-lg animate-pulse"
//                             >
//                                 {/* Avatar skeleton */}
//                                 <div className="w-[40px] h-[40px] bg-gray-200 rounded-full" />

//                                 {/* Text content skeleton */}
//                                 <div className="flex-1">
//                                     <div className="h-5 bg-gray-200 rounded w-3/4" />
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="space-y-4 max-h-[400px] overflow-y-auto">
//                         {data?.stores.map((store: any) => (
//                             <button
//                                 key={store.storeId}
//                                 onClick={() => {
//                                     onSelect(store.storeId);
//                                     onClose();
//                                 }}
//                                 className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
//                             >
//                                 <Image
//                                     src={
//                                         store.avatar ||
//                                         '/images/store-default.png'
//                                     }
//                                     alt={store.storeName || ''}
//                                     width={40}
//                                     height={40}
//                                     className="rounded-full"
//                                 />
//                                 <div className="text-left">
//                                     <div className="font-semibold">
//                                         {store.storeName}
//                                     </div>
//                                     {/* <div className="text-sm text-gray-500">{store.description}</div> */}
//                                 </div>
//                             </button>
//                         ))}
//                     </div>
//                 )}

//                 <button
//                     onClick={onClose}
//                     className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
//                 >
//                     Close
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default SelectStoreModal;
