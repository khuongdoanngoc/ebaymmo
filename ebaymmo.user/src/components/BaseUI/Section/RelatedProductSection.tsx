import RelatedProduct from '@/components/RelatedProduct/RelatedProduct';
export default function RelatedProductSection() {
    return (
        <div className="section-postdetail-other-products first-letter font-beausans w-full mt-[100px] mb-[100px]">
            <div className="container flex flex-col gap-[40px] mx-auto max-w-[1420px]  ">
                <h2 className="related-product text-[30px] font-bold leading-[42px] text-[#3F3F3F] uppercase">
                    Related Products
                </h2>
                <RelatedProduct />
            </div>
        </div>
    );
}
