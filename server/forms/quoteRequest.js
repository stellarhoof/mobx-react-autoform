import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import React from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import {
  Field,
  Checkbox,
  ObjectSelect,
  Grid,
  FieldList,
} from '@lib/components.js'
import * as util from '@lib/util.js'
import * as Control from '@lib/controls.js'

let counties = {
  Arizona: [
    'Apache',
    'Cochise',
    'Coconino',
    'Gila',
    'Graham',
    'Greenlee',
    'La Paz',
    'Maricopa',
    'Mohave',
    'Navajo',
    'Pima',
    'Pinal',
    'Santa Cruz',
    'Yavapai',
    'Yuma',
  ],
  Connecticut: [
    'Fairfield',
    'Hartford',
    'Litchfield',
    'Middlesex',
    'New Haven',
    'New London',
    'Tolland',
    'Windham',
  ],
  Delaware: ['Kent', 'New Castle', 'Sussex'],
}

let addresses = [
  {
    isPrimary: true,
    address: {
      address1: 'CA-123',
      address2: '',
      city: 'Berkeley',
      county: 'Kent',
      state: 'Delaware',
      zip: '94702',
      country: 'USA',
      latitude: 37.85964,
      longitude: -122.28903,
    },
    name: 'Primary',
  },
  {
    isPrimary: false,
    address: {
      address1: '417 Orchard St',
      address2: '',
      city: 'New Haven',
      county: 'Fairfield',
      state: 'Connecticut',
      zip: '06511',
      country: 'USA',
      latitude: 41.3127037,
      longitude: -72.9405799,
    },
    name: '417 Orchard',
  },
  {
    isPrimary: false,
    address: {
      address1: '123123',
      address2: '123',
      city: 'asdf',
      county: 'Yuma',
      state: 'Arizona',
      zip: '123123',
      country: '',
    },
  },
]

let departments = [
  {
    _id: '5ea763feacc703002210a5c1',
    name: 'Department of things ',
    organization: '5ea6ed1479a8c60021156225',
    createdBy: '5ea6ed1479a8c60021156223',
    createdAt: '2020-04-27T23:00:14.876Z',
  },
  {
    _id: '5eeb7fa1eaeebd0021cf1bd7',
    name: 'Department of One',
    organization: '5ede45d411b89c0021f167b0',
    createdBy: '5ede45d411b89c0021f167ae',
    createdAt: '2020-06-18T14:52:17.563Z',
  },
  {
    _id: '5eeb7fafeaeebd0021cf1bda',
    name: 'ABCD',
    organization: '5ede45d411b89c0021f167b0',
    createdBy: '5ede45d411b89c0021f167ae',
    createdAt: '2020-06-18T14:52:31.159Z',
  },
  {
    _id: '5eeb7fb3eaeebd0021cf1bdc',
    name: '1234',
    organization: '5ede45d411b89c0021f167b0',
    createdBy: '5ede45d411b89c0021f167ae',
    createdAt: '2020-06-18T14:52:35.125Z',
  },
]

let displayAddress = ({ address1, city, zip }) => `${address1}, ${city} ${zip}`

let addressField = {
  fields: _.mapValues(_.set('hideLabel', true), {
    address1: {
      validate: 'required',
      component: {
        as: Control.Input,
        placeholder: 'Street Address',
      },
    },
    address2: {
      component: { as: Control.Input, placeholder: 'Apt, Unit, etc' },
    },
    state: {
      validate: 'required',
      component: {
        as: Control.Select,
        placeholder: 'US State',
        options: _.keys(counties),
      },
    },
    county: {
      validate: 'required',
      component: {
        as: Control.Select,
        placeholder: 'County',
        options: ({ path, form }) =>
          counties[form.getValue(util.siblingPath(path, 'state'))],
        useEffect: ({ path, form, field }) =>
          reaction(
            () => field.component.options({ path, form }),
            (counties) =>
              form.setValue(path, _.find(_.eq(form.getValue(path)), counties))
          ),
      },
    },
    city: {
      validate: 'required',
      component: { as: Control.Input, placeholder: 'City' },
    },
    zip: {
      validate: 'required',
      component: { as: Control.Input, placeholder: 'Zip Code' },
    },
    country: { validate: 'required', hidden: true },
    latitude: { hidden: true },
    longitude: { hidden: true },
  }),
  component: {
    as: ({ path, form, disabled, ...props }) => (
      <Grid gap={2} columns={4} {..._.omit('form', props)}>
        <div sx={{ gridColumnEnd: 'span 3' }}>
          <Field disabled={disabled} path={util.joinPaths(path, 'address1')} />
        </div>
        <Field disabled={disabled} path={util.joinPaths(path, 'address2')} />
        <Field disabled={disabled} path={util.joinPaths(path, 'state')} />
        <Field disabled={disabled} path={util.joinPaths(path, 'county')} />
        <Field disabled={disabled} path={util.joinPaths(path, 'city')} />
        <Field disabled={disabled} path={util.joinPaths(path, 'zip')} />
      </Grid>
    ),
  },
}

let primaryAddress = _.get('address', _.find({ isPrimary: true }, addresses))

let addressesOptions = _.map(
  ({ name, address }) => ({
    label: name || displayAddress(address),
    value: address,
  }),
  addresses
)

let requestFields = {
  title: {
    validate: 'required',
    label: 'Request Name',
    description: 'This is name of the request as displayed to all companies.',
    component: { as: Control.Input, placeholder: 'Enter a name' },
  },
  description: {
    validate: 'required',
    description:
      'Enter a description of your request. Include information such as products, services, part numbers, quantities, and anything else you can think of to improve the accuracy of the quotes you will receive. The more detailed your requests are, the more detailed your quotes will be.',
    component: { as: Control.TextArea },
  },
  department: {
    component: {
      as: Control.Select,
      options: _.map((x) => ({ value: x._id, label: x.name }), departments),
    },
  },
  maxResponses: {
    value: 0,
    label: 'Maximum Quotes',
    validate: 'required',
    description:
      'When the limit is met, the request is no longer visible to new companies. Companies respond quicker with limited slots.',
    component: {
      as: Control.Select,
      options: ({ form }) =>
        _.flow(
          _.reject((x) => x > form.value.responseCount),
          _.concat({ label: 'Unlimited', value: 0 })
        )([3, 5, 10]),
    },
  },
  dueAt: {
    validate: 'required',
    value: new Date(),
    label: 'Due Date & Time',
    description:
      'This is the date responses are needed by. When the due date is met, the request will no longer receive any new quotes.',
    component: { as: Control.DateTimeInput },
  },
  unlisted: {
    hidden: true,
    component: {
      useEffect: ({ path, form }) =>
        reaction(
          () => form.value.notify === 'nobody',
          (unlisted) => form.setValue(path, unlisted)
        ),
    },
  },
  notify: {
    value: ({ form }) =>
      form.value.unlisted
        ? 'nobody'
        : _.isEmpty(form.value.socioEconomics)
        ? 'relevant'
        : 'socio',
    validate: 'required',
    description: 'Choose who to notify about this request.',
    component: {
      as: Control.Select,
      options: [
        { label: 'All relevant companies', value: 'relevant' },
        {
          label: 'Relevant companies based on socio-economic classifications',
          value: 'socio',
        },
        {
          label: "Nobody (I'll send the link out myself)",
          value: 'nobody',
        },
      ],
    },
  },
  socioEconomics: {
    hidden: ({ form }) => form.value.notify !== 'socio',
    hideLabel: true,
    component: {
      as: (props) => (
        <Grid gap={10} columns={2}>
          <Control.CheckboxList {...props} />
        </Grid>
      ),
      useEffect: ({ path, form }) =>
        reaction(
          () => form.value.notify,
          () => form.setValue(path, [])
        ),
      options: _.map((value) => ({ value, label: value }), [
        'State of Texas HUB Vendor',
        'Small Business',
        'Veteran Owned Business',
        'Minority Owned Business',
        'Woman Owned Business',
        'African American Owned Business',
        'Hispanic American Owned Business',
        'Native American Owned Business',
        'SBA-Certified Small Disadvantaged Business',
        'SBA-Certified HUB Zone Firm',
        'SBA-Certified 8(a) Firm',
        'Woman Owned Small Business (WOSB)',
        'Economically Disadvantaged Women Owned Small Business (EDWOSB)',
        'Service Disabled Veteran Owned Business (SDVOSB)',
      ]),
    },
  },
  serviceAddress: {
    ...addressField,
    value: primaryAddress,
    newAddress: !primaryAddress,
    saveToAddressBook: false,
    component: {
      as: observer(({ path, form, field, ...props }) => (
        <div {...props}>
          <Grid columns={4}>
            <div sx={{ gridColumnEnd: 'span 3' }}>
              <ObjectSelect
                value={form.getValue(path)}
                onChange={(x) => {
                  field.newAddress = !x
                  form.setValue(path, x)
                }}
                placeholder="+ New Address"
                options={addressesOptions}
              />
            </div>
            <Checkbox
              value={field.newAddress ? field.saveToAddressBook : false}
              disabled={!field.newAddress}
              onChange={(x) => F.setOn('saveToAddressBook', x, field)}
            >
              Save to profile
            </Checkbox>
          </Grid>
          {addressField.component.as({
            path,
            form,
            field,
            disabled: !field.newAddress,
            sx: { mt: 2 },
          })}
        </div>
      )),
    },
  },
  customRequestFormValues: {
    hideLabel: true,
    component: { as: FieldList },
    fields: {
      customField1: { validate: 'required', component: { as: Control.Input } },
      customField2: {
        component: { as: Control.Select, options: ['option1', 'option2'] },
      },
    },
  },
  termsOfService: {
    validate: 'accepted',
    component: { as: Control.Checkbox },
  },
}

export default {
  label: 'Create a new Request for Quote (RFQ)',
  description:
    'A Request for Quote (RFC) is the primary means by which government agencies request private companies for quotes on services and/or products they need',
  component: { as: FieldList },
  fields: requestFields,
  submit: (form) => console.info(JSON.stringify(form.value, null, 2)),
}
