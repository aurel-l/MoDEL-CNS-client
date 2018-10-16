import React, { PureComponent } from 'react';
import { Link, Switch, Route } from 'react-router-dom';
import { parse, stringify } from 'qs';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Icon from '@material-ui/core/Icon';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';

import style from './style.module.css';

class Search extends PureComponent {
  #handleChange = ({ target: { value } }) => {
    const { search, ...nextSearchObject } = parse(this.props.location.search, {
      ignoreQueryPrefix: true,
    });
    const shouldReplace = Boolean(search) === Boolean(value);
    if (value) nextSearchObject.search = value;
    this.props.history[shouldReplace ? 'replace' : 'push']({
      ...this.props.location,
      search: stringify(nextSearchObject),
    });
  };

  render() {
    const {
      location: { search },
    } = this.props;
    const value = parse(search, { ignoreQueryPrefix: true }).search;
    return (
      <>
        <Icon>
          <SearchIcon />
        </Icon>
        <TextField value={value || ''} onChange={this.#handleChange} />
      </>
    );
  }
}

export default () => (
  <menu>
    <div className={style.main}>
      <Button component={Link} color="inherit" to="/">
        Home
      </Button>
      <Button component={Link} color="inherit" to="/browse">
        Browse
      </Button>
      <Button component={Link} color="inherit" to="/help">
        Help
      </Button>
      <Button component={Link} color="inherit" to="/contact">
        Contact
      </Button>
      <Switch>
        <Route path="/browse" exact component={Search} />
      </Switch>
    </div>
    <Switch>
      <Route path="/browse/:accession/:subPage" exact>
        {({ match }) => {
          const { accession, subPage } = match.params;
          return (
            <Tabs
              value={subPage}
              indicatorColor="secondary"
              textColor="secondary"
            >
              <Tab
                component={Link}
                to={`/browse/${accession}/overview`}
                label="overview"
                value="overview"
              />
              <Tab
                component={Link}
                to={`/browse/${accession}/trajectory`}
                label="trajectory"
                value="trajectory"
              />
              <Tab
                component={Link}
                to={`/browse/${accession}/rmsd`}
                label="rmsd"
                value="rmsd"
              />
              <Tab
                component={Link}
                to={`/browse/${accession}/rgyr`}
                label="rgyr"
                value="rgyr"
              />
              <Tab
                component={Link}
                to={`/browse/${accession}/fluctuation`}
                label="fluctuation"
                value="fluctuation"
              />
            </Tabs>
          );
        }}
      </Route>
    </Switch>
  </menu>
);
