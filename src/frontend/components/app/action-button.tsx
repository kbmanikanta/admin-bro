/* eslint-disable no-undef */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */

import React, { ReactNode, ComponentClass } from 'react'
import { withRouter } from 'react-router-dom'

import { RouteComponentProps } from 'react-router'
import { AxiosResponse } from 'axios'
import StyledLink from '../ui/styled-link'
import ApiClient from '../../utils/api-client'
import ViewHelpers from '../../../backend/utils/view-helpers'
import withNotice, { AddNoticeProps } from '../../store/with-notice'
import ActionJSON from '../../../backend/decorators/action-json.interface'
import { ActionResponse } from '../../../backend/actions/action.interface'

type Props = {
  action: ActionJSON;
  className?: string;
  resourceId: string;
  recordId?: string;
  recordIds?: Array<string>;
  actionPerformed?: (actionName: string) => any;
}

/**
 * Renders Button for an action
 *
 * @private
 * @component
 */
class ActionButton extends React.PureComponent<RouteComponentProps & Props & AddNoticeProps> {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  href(): string {
    const {
      action, resourceId, recordId, recordIds,
    } = this.props
    const h = new ViewHelpers()
    const { name: actionName, actionType } = action

    switch (actionType) {
    case 'record':
      if (!recordId) {
        throw new Error('You have to speficy "recordId" for record action')
      }
      return h.recordActionUrl({ resourceId, recordId, actionName })
    case 'resource':
      return h.resourceActionUrl({ resourceId, actionName })
    case 'bulk':
      return h.bulkActionUrl({ resourceId, recordIds, actionName })
    default:
      throw new Error('"actionType" should be either record, resource or bulk')
    }
  }

  handleClick(event): void {
    const {
      action, resourceId, recordId, location,
      history, actionPerformed, addNotice,
    } = this.props

    if (action.guard && !confirm(action.guard)) {
      event.preventDefault()
      return
    }
    if (typeof action.component !== 'undefined' && action.component === false) {
      event.preventDefault()
      const api = new ApiClient()
      let promise: Promise<AxiosResponse<ActionResponse>>
      if (recordId) {
        promise = api.recordAction({
          resourceId, actionName: action.name, recordId,
        })
      } else {
        promise = api.resourceAction({
          resourceId, actionName: action.name,
        })
      }

      promise.then((response) => {
        const { data } = response
        if (data.notice) {
          addNotice(data.notice)
        }
        if (data.redirectUrl && location.pathname !== data.redirectUrl) {
          history.push(data.redirectUrl)
        }
        if (actionPerformed) {
          actionPerformed(action.name)
        }
      })
    }
  }

  render(): ReactNode {
    const {
      action, className,
    } = this.props
    return (
      <StyledLink
        to={this.href()}
        className={`button ${className}`}
        onClick={this.handleClick}
      >
        <span className="icon">
          <i className={action.icon} />
        </span>
        <div className="btn-text">
          {action.label}
        </div>
      </StyledLink>
    )
  }
}

// TODO - remove this hack
export default withRouter(withNotice(ActionButton)) as unknown as ComponentClass<Props>
