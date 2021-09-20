import React, { useEffect, useRef, useState } from 'react';
import { Form, Modal, Ref, TextArea } from 'semantic-ui-react';
import PropTypes, { element, oneOf } from 'prop-types';

const LogsViewer = (props) => {
  const { logs, onRefresh } = props;
  const element = useRef(null)
  const [lastLog, setLastLog] = useState('');
  let refreshLoop;

  useEffect(() => {
    onRefresh();
    if(refreshLoop) {
      clearInterval(refreshLoop);
    }
    refreshLoop = setInterval(() => onRefresh(), 1000);
    return () => {
      if(refreshLoop) {
        clearInterval(refreshLoop);
      }
      refreshLoop = null;
    }
  }, []);

  useEffect(() => {
    let el = element.current
    if(el && logs.length > 0 && logs[logs.length-1] !== lastLog) {
      el.scrollTop = el.scrollHeight;
    }
    setLastLog(logs.length ? logs[logs.length-1] : '')
  }, [logs]);

  return <Ref innerRef={element}>
      <Modal.Content scrolling style={{padding: 0}}>
        <pre className="log-format">{logs.join('\n')}</pre>
      </Modal.Content>
    </Ref>
};

LogsViewer.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string),
  onRefresh: PropTypes.func
}

LogsViewer.defaultProps = {
  logs: [],
  onRefresh: () =>  { }
}

export default LogsViewer;