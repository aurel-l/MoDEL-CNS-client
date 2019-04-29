import React, { useContext, Fragment } from 'react';
import prettyBytes from 'pretty-bytes';

import {
  Icon,
  Divider,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  ExpansionPanelActions,
  Button,
  Typography,
  Chip,
} from '@material-ui/core';
import { InsertDriveFile, ExpandMore, Assignment } from '@material-ui/icons';

import formatNumber from '../../../utils/number-formatter';
import getEstimate from '../../../utils/get-download-time-estimate';
import { BASE_PATH, BASE_PATH_PROJECTS } from '../../../utils/constants';

import { ProjectCtx } from '../../../contexts';

import style from './style.module.css';

const groupPerTypeReducer = (group, file) => {
  let groupName;
  if (file.filename.toLowerCase().endsWith('pdb')) {
    groupName = 'Structure/topology';
  } else {
    groupName = 'Other';
  }
  group[groupName].add(file);
  return group;
};

const newGroup = () => ({
  'Structure/topology': new Set(),
  Trajectory: new Set(),
  Analysis: new Set(),
  Media: new Set(),
  Other: new Set(),
});

const api = [
  'Programmatic API',
  [
    {
      filename:
        'Especially for bigger files, consider using the programmatic API as documented',
      url: BASE_PATH + 'docs/#/files',
      icon: <Assignment />,
    },
  ],
];

export default React.memo(() => {
  const { identifier, files } = useContext(ProjectCtx);

  const groupedFiles = Object.entries(
    files.reduce(groupPerTypeReducer, newGroup()),
  ).filter(([, set]) => set.size);

  return (
    <>
      <Typography variant="h5">Files</Typography>
      {[...groupedFiles, api].map(([key, set]) => (
        <Fragment key={key}>
          <Typography variant="h6" className={style.title}>
            &nbsp;⤷&nbsp;
            {key}
          </Typography>
          {Array.from(set).map(
            ({
              filename,
              url,
              icon,
              md5,
              length,
              metadata: { frames, atoms } = {},
            }) => {
              const estimatedTime = getEstimate(length);
              const href =
                url || `${BASE_PATH_PROJECTS}${identifier}/files/${filename}`;
              return (
                <ExpansionPanel key={md5 || filename}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    className={style.summary}
                  >
                    <Icon className={style.icon}>
                      {icon || <InsertDriveFile />}
                    </Icon>
                    <div>
                      <Typography variant="subtitle2">{filename}</Typography>
                      {length && (
                        <Typography color="textSecondary" variant="caption">
                          {prettyBytes(length)}
                        </Typography>
                      )}
                    </div>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails className={style.details}>
                    {frames && atoms && (
                      <div>
                        containing a total of {formatNumber(atoms)} atoms in{' '}
                        {formatNumber(frames)} frames
                      </div>
                    )}
                    {md5 && (
                      <div>
                        md5 checksum: <code>{md5}</code>
                      </div>
                    )}

                    <div>
                      link: <code>{href}</code>
                    </div>
                  </ExpansionPanelDetails>
                  <Divider variant="middle" />
                  <ExpansionPanelActions>
                    {estimatedTime && (
                      <Chip
                        label={`estimated download time: ${estimatedTime}`}
                        title="According to your current network speed, might vary if connection quality change or if the server is under load"
                        color={
                          estimatedTime.includes('minutes')
                            ? 'secondary'
                            : 'textPrimary'
                        }
                      />
                    )}
                    <Button
                      size="large"
                      color="primary"
                      component="a"
                      href={href}
                      download={!url && filename}
                      target="_blank"
                    >
                      {url ? 'Go' : 'Download'}
                    </Button>
                  </ExpansionPanelActions>
                </ExpansionPanel>
              );
            },
          )}
        </Fragment>
      ))}
    </>
  );
});