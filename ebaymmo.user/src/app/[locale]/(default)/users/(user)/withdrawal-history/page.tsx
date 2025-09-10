import Button from '@/components/BaseUI/Button/button';
import Table from '@/components/BaseUI/Table';
import React from 'react';

const WithdrawalHistory = () => {
    const columns = [
        { header: 'Request Date', accessor: 'date', sortable: true },
        { header: 'Transaction Amount', accessor: 'amount', sortable: true },
        { header: 'Status', accessor: 'statusStyle', sortable: true },
        { header: 'Description', accessor: 'description' }
    ];

    // Sample data for orders
    const data = [
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Withdrawn'
        },
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Withdrawn'
        },
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Cancelled'
        },
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Cancelled'
        },
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Pending'
        },
        {
            date: '30/4/1975',
            amount: '1000',
            description: 'example',
            statusStyle: 'Pending'
        }
    ];

    return (
        <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-beausans">
                    Withdrawal History
                </h1>
                <div className="flex leading-[160%]">
                    <Button
                        type="submit"
                        className="w-full max-w-[462px] 
                        h-10 md:h-[56px] 
                        px-4 md:px-8 
                        py-2 md:py-4 
                        mt-4 md:mt-6 
                        text-sm md:text-base
                        text-white 
                        rounded-[86px] md:rounded-[86px]"
                        style={{
                            background: 'var(--Primary-500, #33A959)'
                        }}
                    >
                        Withdrawal Request
                    </Button>
                </div>
            </div>
            <Table columns={columns} data={data} />
        </div>
    );
};

export default WithdrawalHistory;
