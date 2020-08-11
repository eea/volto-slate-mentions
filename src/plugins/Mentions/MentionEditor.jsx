import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { isEqual } from 'lodash';
import { ReactEditor, useSlate } from 'slate-react';
import { Icon as VoltoIcon } from '@plone/volto/components';
import briefcaseSVG from '@plone/volto/icons/briefcase.svg';
import checkSVG from '@plone/volto/icons/check.svg';
import clearSVG from '@plone/volto/icons/clear.svg';
import InlineForm from 'volto-slate/futurevolto/InlineForm';
import SidebarPopup from 'volto-slate/futurevolto/SidebarPopup';
import { MentionSchema } from './schema';
import {
  getActiveMention,
  getMentionWidget,
  insertMention,
  isActiveMention,
  unwrapMention,
} from './utils';
import { EDITOR } from './constants';

export default () => {
  const dispatch = useDispatch();
  const editor = useSlate();
  const [formData, setFormData] = React.useState({
    id: undefined,
    widget: undefined,
  });

  // Get Object metadata from global state
  const properties = useSelector(
    (state) => state?.schema?.schema?.properties || {},
  );
  const Schema = {
    ...MentionSchema,
    properties: {
      ...MentionSchema.properties,
      id: {
        ...MentionSchema.properties.id,
        choices: Object.keys(properties)
          .map((key) => {
            const val = properties[key];
            if (val?.type !== 'dict') {
              return [key, val?.title || key];
            }
            return false;
          })
          .filter((val) => !!val),
      },
    },
  };

  const active = getActiveMention(editor);
  const [mentionNode] = active;
  const isMention = isActiveMention(editor);

  // Update the form data based on the current mention
  const mentionRef = React.useRef(null);
  React.useEffect(() => {
    if (isMention && !isEqual(mentionNode, mentionRef.current)) {
      mentionRef.current = mentionNode;
      setFormData(mentionNode.data || {});
    } else if (!isMention) {
      mentionRef.current = null;
    }
  }, [mentionNode, isMention, dispatch]);

  const saveDataToEditor = React.useCallback(
    (formData) => {
      if (formData.id) {
        insertMention(editor, formData);
      } else {
        unwrapMention(editor);
      }
    },
    [editor],
  );

  return (
    <SidebarPopup open={true}>
      <InlineForm
        schema={Schema}
        title={Schema.title}
        icon={<VoltoIcon size="24px" name={briefcaseSVG} />}
        onChangeField={(id, value) => {
          setFormData({
            ...formData,
            [id]: value,
            widget: getMentionWidget(value, properties[value]),
          });
        }}
        formData={formData}
        headerActions={
          <>
            <button
              onClick={() => {
                saveDataToEditor(formData);
                dispatch({ type: EDITOR, show: false });
                ReactEditor.focus(editor);
              }}
            >
              <VoltoIcon size="24px" name={checkSVG} />
            </button>
            <button
              onClick={() => {
                dispatch({ type: EDITOR, show: false });
                setFormData({});
                ReactEditor.focus(editor);
              }}
            >
              <VoltoIcon size="24px" name={clearSVG} />
            </button>
          </>
        }
      />
    </SidebarPopup>
  );
};