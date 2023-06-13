import { API_PREFIX, PREFIX, X_API_KEY } from '@/services/settings';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { history, useRequest } from '@umijs/max';
import { Card, Col, Modal, Pagination, Row, Space, Table, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ActionBuilder from './builders/ActionBuilder';
import ColumnBuilder from './builders/ColumnBuilder';
import ActionModal from './components/ActionModal';
import styles from './index.less';

const { confirm } = Modal;

const Index = () => {
  const [pageQuery, setPageQuery] = useState<string>('');
  const [sortQuery, setSortQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalUrl, setModalUrl] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<BasicListApi.TableColumn[]>(
    [],
  );
  const [tableColumns, setTableColumns] = useState<BasicListApi.TableColumn[]>(
    [],
  );
  const batchTableColumns = useRef<BasicListApi.TableColumn[]>([]);

  const init = useRequest<{ data: BasicListApi.ListData }>(
    `${API_PREFIX}/admins${X_API_KEY}${pageQuery}${sortQuery}`,
  );
  const request = useRequest(
    (values: any) => {
      message.loading({
        content: 'Processing...',
        key: 'process',
        duration: 0,
      });
      const { uri, method, ...formValues } = values;
      return {
        url: `${PREFIX}${uri}`,
        method,
        data: {
          ...formValues,
          'X-API-KEY': 'antd',
        },
      };
    },
    {
      manual: true,
      onSuccess: (data: any) => {
        message.success({
          content: data?.message,
          key: 'process',
        });
      },
      formatResult: (res: any) => {
        return res;
      },
    },
  );
  useEffect(() => {
    init.run();
  }, [pageQuery, sortQuery]);

  useEffect(() => {
    if (init?.data?.layout?.tableColumn) {
      const tableColumns = ColumnBuilder(
        init.data.layout.tableColumn,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        actionHandler,
      );
      batchTableColumns.current = tableColumns;
      setTableColumns(tableColumns);
    }
  }, [init?.data?.layout?.tableColumn]);
  const batchOverview = (dataSource: BasicListApi.TableColumn[]) => {
    return (
      <Table
        size="small"
        rowKey="id"
        columns={[
          batchTableColumns.current[0] || {},
          batchTableColumns.current[1] || {},
        ]}
        dataSource={dataSource}
      />
    );
  };
  function actionHandler(
    action: BasicListApi.Action,
    record: BasicListApi.TableColumn,
  ) {
    switch (action.action) {
      case 'modal': {
        const url: string | undefined = action.uri?.replace(
          /:\w+/g,
          (field) => record[field.replace(':', '')],
        );
        setModalUrl(url as string);
        setIsModalOpen(true);
        break;
      }
      case 'page': {
        const url = action.uri?.replace(
          /:\w+/g,
          (field) => record[field.replace(':', '')],
        );
        history.push(`/basicList${url}`);
        break;
      }
      case 'reload':
        init.run();
        break;
      case 'delete':
        confirm({
          title: 'Are you sure delete this task?',
          icon: <ExclamationCircleOutlined />,
          content: batchOverview(
            Object.keys(record).length ? [record] : selectedRows,
          ),
          okText: 'Sure To Delete!',
          cancelText: 'Cancel',
          onOk() {
            // 加上 return 就可以实现按钮 loading 原理看文档 Promise
            return request.run({
              uri: action.uri,
              method: action.method,
              type: 'delete',
              // 批量和单行操作
              ids: Object.keys(record).length ? [record.id] : selectedRowKeys,
            });
          },
          onCancel() {},
        });
        break;
      default:
        break;
    }
  }
  // const searchLayout = () => {};
  const beforeTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolbar}>
          <Space>
            {ActionBuilder(init?.data?.layout?.tableToolBar, actionHandler)}
          </Space>
        </Col>
      </Row>
    );
  };
  const paginationChangeHandler = (page: any, per_page: any) => {
    setPageQuery(`&page=${page}&per_page=${per_page}`);
  };
  const afterTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolbar}>
          <Pagination
            total={init?.data?.meta?.total || 0}
            current={init?.data?.meta?.page || 1}
            pageSize={init?.data?.meta?.per_page || 10}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `Total ${total} items`}
            onChange={paginationChangeHandler}
            onShowSizeChange={paginationChangeHandler}
          />
        </Col>
      </Row>
    );
  };
  const tableChangeHandler = (_: any, __: any, sorter: any) => {
    if (!sorter.order) {
      setSortQuery('');
    } else {
      const orderBy = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortQuery(`&sort=${sorter.field}&order=${orderBy}`);
    }
  };
  const hideModal = (reload = false) => {
    setIsModalOpen(false);
    if (reload) {
      init.run();
    }
  };
  const rowSelection = {
    selectedRowKeys: selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
  };
  const batchToolBar = () =>
    selectedRowKeys.length
      ? ActionBuilder(init?.data?.layout?.batchToolBar, actionHandler)
      : null;
  // !!selectedRowKeys.length &&
  // ActionBuilder(init?.data?.layout?.batchToolBar, actionHandler);
  return (
    <PageContainer>
      {/* {searchLayout()} */}
      <Card>
        {beforeTableLayout()}
        <Table
          rowKey="id"
          dataSource={init?.data?.dataSource}
          columns={tableColumns}
          pagination={false}
          loading={init.loading}
          onChange={tableChangeHandler}
          rowSelection={rowSelection}
        />
        {afterTableLayout()}
      </Card>
      <ActionModal
        isModalOpen={isModalOpen}
        hideModal={hideModal}
        modalUrl={modalUrl}
      />
      <FooterToolbar>{batchToolBar()}</FooterToolbar>
    </PageContainer>
  );
};
export default Index;
