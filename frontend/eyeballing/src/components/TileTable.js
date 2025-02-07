import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  PagingState,
  CustomPaging,
  SortingState,
  SearchState,
} from '@devexpress/dx-react-grid';
import {
  Grid as TableGrid,
  Table,
  TableHeaderRow,
  Toolbar as TableToolbar,
  SearchPanel,
  TableColumnResizing,
  PagingPanel,
} from '@devexpress/dx-react-grid-material-ui';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import FilterListIcon from '@material-ui/icons/FilterList';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import GetApp from '@material-ui/icons/GetApp';
import CircularProgress from '@material-ui/core/CircularProgress';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import DriApi from '../api/Api';
import ChooserDownloadDialog from './ChooserDownloadDialog';
import ChooseFilterCommentDialog from './ChooseFilterCommentDialog';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing(2),
  },
  card: {
    height: 'auto',
    color: theme.palette.text.secondary,
    backgroundColor: '#fff',
    marginBottom: theme.spacing(8),
  },
  title: {
    flexGrow: 1,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    top: '50%',
    zIndex: 999,
    transform: 'translateY(-50%)',
  },
  progress: {
    margin: theme.spacing(2),
  },
  okButton: {
    color: theme.typography.successColor,
  },
  filterIconButton: {
    borderRadius: 0,
  },
}));

function CircularIndeterminate() {
  const classes = useStyles();

  return (
    <div className={classes.loading}>
      <CircularProgress className={classes.progress} color="secondary" />
    </div>
  );
}

function convertToCSV(objArray) {
  let str = `tilename;release;inspected;username;datetime;comment;ra;dec\r\n`;

  for (let i = 0; i < objArray.length; i++) {
    let line = '';
    for (const index in objArray[i]) {
      if (line !== '') line += ';';
      line += objArray[i][index];
      line.trim();
    }
    str += `${line}\r\n`;
  }

  return str;
}

function TileTable({ backLink, currentRelease }) {
  const api = new DriApi();
  const [downloadData, setDownloadData] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [sorting, setSorting] = useState([{ columnName: 'dts_date', direction: 'desc' }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterComment, setFilterComment] = useState('');
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const classes = useStyles();

  const columns = [
    { name: 'dts_dataset__tile__tli_tilename', title: 'Tile', getCellValue: row => row.tilename },
    { name: 'dts_dataset__inspected__isp_value', title: 'Status', getCellValue: row => renderInspectionValue(row.isp_value) },
    { name: 'owner__username', title: 'Owner', getCellValue: row => row.owner },
    { name: 'dts_date', title: 'Date', getCellValue: row => row.dts_date },
    { name: 'dts_comment', title: 'Comments', getCellValue: row => row.dts_comment },
  ];

  const defaultColumnWidths = [
    { columnName: 'dts_dataset__tile__tli_tilename', width: 150 },
    { columnName: 'dts_dataset__inspected__isp_value', width: 100 },
    { columnName: 'owner__username', width: 150 },
    { columnName: 'dts_date', width: 150 },
    { columnName: 'dts_comment', width: 'auto' },
  ];

  function renderInspectionValue(status) {
    if (status !== null) {
      return (
        status === true ? (
          <ThumbUpIcon className={classes.okButton} />
        ) : (
            <ThumbDownIcon color="error" />
          )
      );
    }
    return '-';
  }


  function clearData() {
    setLoading(true);
    setCurrentPage(0);
    setRows([]);
  }

  function loadData() {
    api.comments({
      release: currentRelease,
      sorting,
      search,
      dts_type: filterComment,
      offset: currentPage === 0 ? 0 : currentPage * 9,
      limit: 10,
    }).then((comments) => {
      if (comments.results && comments.results.length > 0) {
        setRows(comments.results);
        setTotalCount(comments.count);
        setLoading(false);
      } else {
        clearData();
      }
    }).finally(() => {
      setLoading(false);
    });
  }

  async function loadDownloadData() {
    const comments = await api.comments({
      release: currentRelease,
      sorting,
      search,
      dts_type: filterComment,
    });

    if (comments && comments.length > 0) {
      setDownloadData(comments.map(comment => ({
        tilename: comment.tilename,
        release: comment.release_name,
        inspected: comment.isp_value,
        username: comment.owner,
        datetime: comment.dts_date,
        comment: comment.dts_comment,
        ra: comment.dts_ra,
        dec: comment.dts_dec,
      })));
    } else {
      setDownloadData([]);
    }
  }

  useEffect(() => {
    loadData();
  }, [sorting, currentPage, search, currentRelease, filterComment]);

  useEffect(() => {
    loadDownloadData();
  }, [sorting, search, currentRelease, filterComment]);

  function downloadTableData(format) {
    if (downloadData && downloadData.length > 0) {
      let dataStr = '';
      if (format === 'json') {
        dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(downloadData))}`;
      } else if (format === 'csv') {
        dataStr = `data:text/csv;charset=utf-8,${convertToCSV(downloadData)}`;
      }

      const downloadTag = document.getElementById('downloadDialogLink');
      downloadTag.setAttribute('href', dataStr);
      downloadTag.setAttribute('download', `report.${format}`);
      downloadTag.click();
    }
  }


  function handleDownloadDialog(checked) {
    if (typeof checked === 'string') {
      downloadTableData(checked);
    }
    setShowDownloadDialog(!showDownloadDialog);
  }

  function changeSorting(value) {
    clearData();
    setDownloadData([]);
    setSorting(value);
  }

  function handleSearch(value) {
    clearData();
    setSearch(value);
  }

  function changeCurrentPage(value) {
    clearData();
    setCurrentPage(value);
  }

  const handleFilterDialogOpen = () => setShowFilterDialog(true);

  const handleFilterDialogClose = (value) => {
    if (typeof value === 'string') setFilterComment(value);
    setShowFilterDialog(false);
  };
  return (
    <React.Fragment>
      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="stretch"
      >
        <Card className={classes.card}>
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              Reporting
            </Typography>
            {backLink}
            <IconButton
              aria-label="Home"
              aria-controls="home-appbar"
              aria-haspopup="true"
              color="inherit"
              className={classes.filterIconButton}
              onClick={handleFilterDialogOpen}
            >
              <FilterListIcon />
              <Typography variant="button" display="block">
                Filter
              </Typography>
            </IconButton>
            <IconButton
              aria-label="Download report"
              aria-controls="download-appbar"
              aria-haspopup="true"
              color="inherit"
              onClick={handleDownloadDialog}
              disabled={downloadData.length === 0}
            >
              <GetApp />
            </IconButton>
          </Toolbar>

          <TableGrid rows={rows} columns={columns} className={classes.root}>
            <SearchState
              onValueChange={handleSearch}
            />
            <SortingState
              sorting={sorting}
              onSortingChange={changeSorting}
            />
            <PagingState
              currentPage={currentPage}
              onCurrentPageChange={changeCurrentPage}
              pageSize={10}
            />
            <CustomPaging totalCount={totalCount} />
            <Table />
            <TableColumnResizing defaultColumnWidths={defaultColumnWidths} />
            <TableHeaderRow showSortingControls />
            <TableToolbar />
            <SearchPanel />
            <PagingPanel />
            {loading ? <CircularIndeterminate /> : null}
          </TableGrid>
        </Card>
      </Grid>
      <ChooseFilterCommentDialog
        open={showFilterDialog}
        selectedValue={filterComment}
        handleClose={handleFilterDialogClose}
      />
      <ChooserDownloadDialog
        open={showDownloadDialog}
        handleClose={handleDownloadDialog}
      />
    </React.Fragment>
  );
}


export default TileTable;
