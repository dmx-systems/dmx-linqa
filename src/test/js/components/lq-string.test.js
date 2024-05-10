/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test, verify } from '@jest/globals'
import { mount } from '@vue/test-utils'

import component from 'components/lq-string'

import lq from 'lq-globals'
jest.mock('lq-globals', () => ({
  __esModule: true,
  default: {
    getString: jest.fn()
  },
}));

describe('lq-string', () => {
    test('should render plain text retrieved using key and additional value', () => {
        // given:
        const givenText = 'Hello World of Vue Tests'
        lq.getString.mockReturnValue(givenText)

        const textKey = 'textKey'
        const value = 'somevalue'

        const wrapper = mount(component, {
            slots: {
                default: [ textKey ]
            },
            propsData: {
                html: false,
                value: value
            }
        })

        // when:
        const result = wrapper.find('[class=lq-string]')

        // then:
        expect(result.text()).toBe(givenText)
        expect(lq.getString).toBeCalledWith(textKey, value)
    })

    test('should render HTML text retrieved using key and additional value', () => {
        // given:
        const givenHtml = '<h1>Hello World of Vue Tests</h1>'
        lq.getString.mockReturnValue(givenHtml)

        const textKey = 'textKey'
        const value = 'somevalue'

        const wrapper = mount(component, {
            slots: {
                default: [ textKey ]
            },
            propsData: {
                html: true,
                value: value
            }
        })

        // when:
        const result = wrapper.find('[class=lq-string]')

        // then:
        const headline = result.find('h1')
        expect(headline.html()).toBe(givenHtml)
        expect(lq.getString).toBeCalledWith(textKey, value)
    })
})