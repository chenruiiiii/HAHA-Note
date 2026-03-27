'use client';
import { Key } from 'react';
import styles from './style.module.scss';
import { Segmented, Table, TableColumnsType, TableProps } from 'antd';

const RepositoryFiltering = () => {
  // const filtering_options = [
  //   {
  //     label: 'mine',
  //     value: '我个人的',
  //   },
  //   {
  //     label: 'cooperate',
  //     value: '我协作的',
  //   },
  // ];
  const filtering_options_map = ['我个人的', '我协作的'];

  interface DataType {
    key: Key;
    name: string; // 名称
    desc: string; // 描述
    time: Date; // 更新时间
  }

  const columns: TableColumnsType<DataType> = [
    {
      title: '名称',
      dataIndex: 'name',
      width: '20%',
      showSorterTooltip: { target: 'full-header' },
      sorter: (a, b) => a.name.length - b.name.length,
      sortDirections: ['descend'],
    },
    {
      title: '简介',
      dataIndex: 'desc',
      width: '60%',
      defaultSortOrder: 'descend',
    },
    {
      title: '更新时间',
      dataIndex: 'time',
      width: '20%',
      sorter: (a, b) => a.time.getTime() - b.time.getTime(),
    },
  ];

  const data = [
    {
      key: '1',
      name: '项目',
      desc: '项目简介1项目简介1项目简介1项目简介1项目简介1项目简介1项目简介1项目简介1',
      time: new Date('2023-03-19 21:33:00'),
    },
    {
      key: '2',
      name: 'Jim Green',
      desc: '项目简介2',
      time: new Date('2023-03-09 11:33:00'),
    },
  ];

  const onChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter, extra) => {
    console.log('params', pagination, filters, sorter, extra);
  };
  return (
    <>
      <div className={styles['repository-filtering']}>
        <Segmented<string>
          options={filtering_options_map}
          defaultValue="我个人的"
          onChange={(value) => {
            console.log(value); // string
          }}
        />
      </div>
      <div className="file-table">
        <Table<DataType>
          columns={columns}
          dataSource={data}
          // onChange={onChange}
          showSorterTooltip={{ target: 'sorter-icon' }}
        />
      </div>
    </>
  );
};

export default RepositoryFiltering;
