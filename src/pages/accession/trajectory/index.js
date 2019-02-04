import React, { memo } from 'react';
import { round } from 'lodash-es';

import {
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
} from '@material-ui/core';

import NGLViewerWithControls from '../../../components/ngl-viewer-with-controls';

import style from './style.module.css';

const TrajectoryMetadata = memo(({ metadata }) => (
  <fieldset>
    <legend>
      <Typography variant="h6">Statistics</Typography>
    </legend>
    <fieldset>
      <legend>Counts</legend>
      <TextField
        className={style['text-field']}
        readOnly
        label="System atoms"
        title="Total number of atoms in the system"
        value={metadata.SYSTATS}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Proteins atoms"
        title="Number of protein atoms in the system"
        value={metadata.PROTATS}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Proteins residues"
        title="Number of protein residues in the system"
        value={metadata.PROT}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Phospholipids"
        title="Number of membrane molecules in the system"
        value={metadata.DPPC}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Solvent molecules"
        title="Number of solvent molecules in the system"
        value={metadata.SOL}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Positive ions"
        title="Number of positively charged ions in the system"
        value={metadata.NA}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Negative ions"
        title="Number of negatively charged ions in the system"
        value={metadata.CL}
      />
    </fieldset>
    <fieldset>
      <legend>Simulation box</legend>
      <TextField
        className={style['text-field']}
        readOnly
        label="Type"
        title="Box type"
        value={metadata.BOXTYPE}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Size X"
        title="Simulated system box X dimension"
        value={metadata.BOXSIZEX}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              nm
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Size Y"
        title="Simulated system box Y dimension"
        value={metadata.BOXSIZEY}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              nm
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Size Z"
        title="Simulated system box Z dimension"
        value={metadata.BOXSIZEZ}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              nm
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Volume"
        title="Simulated system box volume"
        value={round(
          +metadata.BOXSIZEX * +metadata.BOXSIZEY * +metadata.BOXSIZEZ,
          5,
        )}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              nm³
            </InputAdornment>
          ),
        }}
      />
    </fieldset>
    <fieldset>
      <legend>Other</legend>
      <TextField
        className={style['text-field']}
        readOnly
        label="Length"
        title="Simulation length"
        value={metadata.LENGTH}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              ns
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Timestep"
        title="Simulation timestep"
        value={metadata.TIMESTEP}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              fs
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Snapshots"
        title="Number of snapshots"
        value={metadata.SNAPSHOTS}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Frequency"
        title="Frequency of snapshots"
        value={metadata.FREQUENCY}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              ps
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Force field"
        title="Force field"
        value={metadata.FF}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Temperature"
        title="Temperature"
        value={metadata.TEMP}
        InputProps={{
          endAdornment: (
            <InputAdornment variant="filled" position="end">
              K
            </InputAdornment>
          ),
        }}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Water type"
        title="Water type"
        value={metadata.WAT}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Ensemble"
        title="Simulation ensemble"
        value={metadata.ENSEMBLE}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Pressure coupling"
        title="Pressure coupling method"
        value={metadata.PCOUPLING}
      />
      <TextField
        className={style['text-field']}
        readOnly
        label="Membrane"
        title="Membrane type"
        value={metadata.MEMBRANE}
      />
    </fieldset>
  </fieldset>
));

const Trajectory = ({
  metadata,
  match,
  // extract, event if unused
  location,
  history,
  staticContext,
  ...props
}) => (
  <>
    <Card className={style.card}>
      <CardContent>
        <TrajectoryMetadata metadata={metadata} />
      </CardContent>
    </Card>
    <Card className={style.card}>
      <NGLViewerWithControls
        accession={match.params.accession}
        metadata={metadata}
        className={style.container}
      />
    </Card>
  </>
);

export default Trajectory;
