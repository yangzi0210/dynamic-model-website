import { Space, Tag } from 'antd';
import dayjs from 'dayjs';
import ActionBuilder from './ActionBuilder';

const ColumnBuilder = (
  tableColumn: BasicListApi.TableColumn[] | undefined,
  actionHandler: BasicListApi.ActionHandler,
) => {
  const newColumns: BasicListApi.TableColumn[] = [];
  (tableColumn || []).forEach((column) => {
    if (column.hideInColumn !== true) {
      switch (column.type) {
        case 'datetime':
          column.render = (value: any) => {
            return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
          };
          break;
        case 'switch':
          column.render = (value: any) => {
            const option = (column.data || []).find(
              (item: any) => item.value === value,
            );
            return <Tag color={value ? 'blue' : 'red'}>{option?.title}</Tag>;
          };
          break;
        case 'actions':
          column.render = (_: any, record: any) => {
            return (
              <Space>
                {ActionBuilder(column.actions, actionHandler, false, record)}
              </Space>
            );
          };
          break;
        default:
          break;
      }
      newColumns.push(column);
    }
  });

  const idColumn: BasicListApi.TableColumn[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
    },
  ];

  return idColumn.concat(newColumns);
};

export default ColumnBuilder;
