import { Button } from 'antd';
import type { ButtonType } from 'antd/lib/button';

const ActionBuilder = (
  actions: BasicListApi.Action[] | undefined,
  actionHandler: BasicListApi.ActionHandler,
  loading?: boolean,
  record?: any,
) => {
  return (actions || []).map((action) => {
    if (action.component === 'button') {
      return (
        <Button
          type={action.type as ButtonType}
          key={action.text}
          onClick={() => actionHandler(action, record)}
          loading={loading}
        >
          {action.text}
        </Button>
      );
    }
    return null;
  });
};
export default ActionBuilder;